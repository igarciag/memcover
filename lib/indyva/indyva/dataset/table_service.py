'''
Created on Jul 19, 2013

:author: Juan Morales
'''

from functools import partial

from indyva.core.names import INamed
from indyva.facade.showcase import Case
from .table import Table, TableView
from indyva.dataset.schemas import TableSchema
from .abc_table import ITableView
from indyva.dataset.mongo_backend.table import MongoTable
import collections, json, sys
import pandas as pd
from .schemas import AttributeSchema
if sys.version_info[0] < 3: from StringIO import StringIO
else: from io import StringIO

global data_dir
global index_col
data_dir = "/app/data/import"
index_col = 'id_index'


class TableService(INamed):
    '''
    This class provide a facade for managing table objects
    '''

    def __init__(self, name='TableSrv'):
        '''
        @param name: The unique name of the service
        '''
        self._tables = Case().tag(name) \
                             .tag(Table.__name__) \
                             .tag(TableView.__name__)
        INamed.__init__(self, name)

    def register_in(self, dispatcher):
        dispatcher.add_method(self.new_table)
        dispatcher.add_method(self.expose_table)
        dispatcher.add_method(self.del_table)
        dispatcher.add_method(self.import_data)        
        dispatcher.add_method(self.show_data)        
        dispatcher.add_method(self.load_data_server)
        dispatcher.add_method(self.save_schema)
        dispatcher.add_method(self.save_data)
        dispatcher.add_method(self.set_data)
        # TableView properties
        dispatcher.add_method(partial(self._proxy_property, 'name'), 'name')
        dispatcher.add_method(partial(self._proxy_property, 'index'), 'index')
        dispatcher.add_method(partial(self._proxy_property, 'schema'), 'schema')
        dispatcher.add_method(partial(self._proxy_property, 'view_args'), 'view_args')
        # TableView methods
        dispatcher.add_method(partial(self._proxy, 'get_data'), 'get_data')
        dispatcher.add_method(partial(self._proxy, 'find'), 'find')
        dispatcher.add_method(partial(self._proxy, 'find_one'), 'find_one')
        dispatcher.add_method(partial(self._proxy, 'distinct'), 'distinct')
        dispatcher.add_method(partial(self._proxy, 'aggregate'), 'aggregate')
        dispatcher.add_method(partial(self._proxy, 'row_count'), 'row_count')
        dispatcher.add_method(partial(self._proxy, 'column_count'), 'column_count')
        dispatcher.add_method(partial(self._proxy, 'column_names'), 'column_names')
        # Table methods
        dispatcher.add_method(partial(self._proxy, 'data'), 'data')
        dispatcher.add_method(partial(self._proxy, 'insert'), 'insert')
        dispatcher.add_method(partial(self._proxy, 'update'), 'update')
        dispatcher.add_method(partial(self._proxy, 'remove'), 'remove')
        dispatcher.add_method(partial(self._proxy, 'add_column'), 'add_column')
        dispatcher.add_method(partial(self._proxy, 'add_derived_column'), 'add_derived_column')
        dispatcher.add_method(partial(self._proxy, 'rename_columns'), 'rename_columns')

    def _proxy(self, method, table_oid, *args, **kwargs):
        table = self._tables[table_oid]
        result = table.__getattribute__(method)(*args, **kwargs)
        if isinstance(result, ITableView):
            self._tables[result.oid] = result
        return result

    def _proxy_property(self, method, table_oid):
        table = self._tables[table_oid]
        result = table.__getattribute__(method)
        if isinstance(result, ITableView):
            self._tables[result.oid] = result
        return result

    def new_table(self, name, data, schema=None, prefix=''):
        '''
        :param str name: If a name is not provided, an uuid is generated
        :param dict data: A list of dicts, each dict is a row.
        :param schema: The schema associated to the data.
        :param str prefix: Prepended to the name creates the oid
        '''
        new_table = Table(name, schema, prefix=prefix).data(data)
        self._tables[new_table.oid] = new_table
        return new_table

    def expose_table(self, table):
        self._tables[table.oid] = table
        return table

    def del_table(self, oid):
        self._tables.pop(oid)

    def __getattr__(self, method):
        if method in ['name', 'index', 'view_args', 'schema']:
            return partial(self._proxy_property, method)
        else:
            return partial(self._proxy, method)

    def load_data(self, str_data, table_name, schema=None): # Load new data to dataset (removing old data)
        global index_col

        # Clean CSV (extra columns with comma ',')
        str_data = self.process_data(str_data)

        # Receive the data as string
        data=StringIO(str_data)
        df = pd.read_csv(data, sep=",")

        # Create id_index column
        if index_col in df.columns:
            df.drop(labels=[index_col], axis=1, inplace = True)
        df.insert(0, index_col, df.index)

        df.fillna("NaN", inplace=True)

        table = self._tables[table_name]

        table._schema = None
        if not schema is None:
            print "Schema loaded with file_schema.json"
            table._schema = TableSchema(schema['attributes'], schema['index'], schema['order'])         
        
        table.data(df)

        _backend = MongoTable(table_name, table._schema, prefix='')
        _backend.data(df)

        return table._schema, table._schema._schema['attributes']

    def concat_data(self, str_data, table_name, schema=None, new_cols=None): # Concat new data to current dataset
        global index_col

        # Clean CSV (extra columns with comma ',')
        str_data = self.process_data(str_data)

        # Receive the data as string
        data=StringIO(str_data)
        df = pd.read_csv(data, sep=",")
        df.fillna("NaN", inplace=True)

       	table = self._tables[table_name]

        try: max_id_index = table.find_one(sort=[(index_col, -1)])[index_col]
        except: max_id_index = 0

        # Create id_index column
        if index_col in df.columns:
            df.drop(labels=[index_col], axis=1, inplace = True)
        if '' in df.columns:
            df.drop(labels=[''], axis=1, inplace = True)
        df.insert(0, index_col, range(max_id_index+1, max_id_index+df.shape[0]+1))

        concat_schema = {}

        # Add columns of the new data (Union schemas)
        if new_cols is not None:
            if index_col in new_cols: new_cols.remove(index_col)
            for attr in new_cols:
                attr_utf = attr#.encode('utf-8')
                concat_schema[attr_utf] = dict(AttributeSchema.infer_from_data(df[attr_utf])._schema)

            for add_attr in concat_schema.keys():
                table.add_column(add_attr, concat_schema[add_attr]['attribute_type'])

        dict_data = df.to_dict()
        list_all_insert = []
        data_insert = {}
        continue_bool = True
        i = 0
        while continue_bool:
            for data in dict_data.keys():
                try: data_insert[data] = dict_data[data][i]
                except:
                    continue_bool = False
                    break
            i += 1
            if continue_bool:
                list_all_insert.append(data_insert)
                data_insert = {}

        table.insert(list_all_insert)

        return table._schema, concat_schema

    def load_data_server(self, file_name, table_name, openAdd=False, cols_old=None, associatedJson=False): # Load a file (on server) by name
        global data_dir
        global index_col

        absolute_path = data_dir+"/"+file_name

        from os import listdir, mkdir
        from os.path import isdir

        if not file_name in listdir(data_dir):
            return "ERROR", "The file '"+absolute_path+" doesn't exist\nPlease, load another file"

        str_data = ""
        with open(absolute_path, "r") as text_file:
            print "OPENED FILE - " + absolute_path
            str_data = text_file.read();

        if not cols_old is None:
            import unicodedata
            table = self._tables[table_name]
            cols_old = table._schema._schema['attributes'].keys()
            cols_new = str_data.split('\n')[0].split(',')
            cols_add = [val for val in cols_new if not self.strip_accents(val) in [self.strip_accents(val2) for val2 in cols_old]]
            
        if str_data == "": return "ERROR", "Cannot read file '"+file_name+"/"+data_dir+"'"

        schema = None
        if (associatedJson == True): # Open the _schema.json and load the schema
            with open(''.join(absolute_path.split('.')[:-1])+"_schema.json", "r") as text_file:
                schema = json.load(text_file)

       	if openAdd == True: resp = self.load_data(str_data, table_name, schema)
        else: resp = self.concat_data(str_data, table_name, schema, cols_add)
       	return "OK", resp[0], resp[1]

    def save_schema(self, table_name, schema, changes=None, datasetName=None, saveSchemaFile=False): # Save a edited schema
        global data_dir

        if isinstance(schema, basestring): schema = json.loads(schema, object_pairs_hook=collections.OrderedDict)
        else: schema = collections.OrderedDict(schema)

        table = self._tables[table_name]  

        if not changes is None:
            for name in changes.keys():
                if name == changes[name]: del changes[name]
            table.rename_columns(changes)
        table._schema = TableSchema(schema['attributes'], schema['index'], schema['order'])

        from os import listdir, mkdir
        from os.path import isdir
        from pprint import pprint

        if saveSchemaFile == True:
            result_schema = {'index': schema['index'], 'order': schema['order'], 'attributes': schema['attributes']}

            with open(data_dir+"/"+datasetName+"_schema.json", "w") as text_file:
                #pprint(table._schema, text_file)
                json.dump(result_schema, text_file)

        return "OK"

    def save_data(self, table_name, datasetName, data, schema): # Save a edited schema
        global data_dir

        df = pd.DataFrame(data)
        df.fillna("NaN", inplace=True)
        df.to_csv(data_dir+"/"+datasetName+".csv", sep=',', encoding='utf-8', cols=schema["order"], index=False)

        resp = self.save_schema(table_name, schema, datasetName=datasetName, saveSchemaFile=True)

        if resp == "OK": return "OK"
        return "ERROR: The schema could not be saved"

    def import_data(self, str_data, table_name, file_name): # Import file to server-side
        global data_dir

        file_name = file_name.encode('utf-8')

        from os import listdir, mkdir
        from os.path import isdir

        if not isdir(data_dir): mkdir(data_dir)

        if file_name in listdir(data_dir):
            return "ERROR: There is already a file called '"+file_name+"'\nPlease, change the filename"

        with open(data_dir+"/"+file_name, "w") as text_file:
            text_file.write(str_data.encode('utf-8'))

        return "OK"

    def show_data(self): # Return all filenames of data directory
        global data_dir

        from os import listdir, mkdir
        from os.path import isdir

        if not isdir(data_dir): mkdir(data_dir)

       	return [f for f in listdir(data_dir)]

    def process_data(self, str_data): # Process data to remove extra rows (intermediate headers, means...)
        try: str_data = str_data.encode('utf-8')
        except: pass
        lines = [line.rstrip(',') for line in str_data.split('\n')]
        headers = lines[0]
        result = [headers]

        for line in lines:
            if line == headers: continue
            if float(line.split(',').count("")) >= float(len(headers) / 2): continue
            if (float(line.split(',').count("")) / float(len(line.split(',')))) >= 0.5: continue
            result.append(line)

        result = '\n'.join(result)

        return result

    def strip_accents(self, s):
        import unicodedata
        try: return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
        except: return ''.join(c for c in unicodedata.normalize('NFD', s.decode('utf-8')) if unicodedata.category(c) != 'Mn')

    def set_data(self, table_name, table_dict):
        table = self._tables[table_name]

        data = table_dict["data"]
        schema = table_dict["schema"]

        df = pd.DataFrame(data)
        df.fillna("NaN", inplace=True)        

        table.data(df)

        _backend = MongoTable(table_name, table._schema, prefix='')
        _backend.data(df)

        table._schema = TableSchema(schema['attributes'], schema['index'], schema['order'])

        #from pprint import pprint
        #pprint(table.find_one())
        #print "==================================================="
        #print "==================================================="
        #print "==================================================="
        return "OK"
        