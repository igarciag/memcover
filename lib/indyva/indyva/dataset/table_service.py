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
if sys.version_info[0] < 3: from StringIO import StringIO
else: from io import StringIO


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
        dispatcher.add_method(self.load_data)
        dispatcher.add_method(self.concat_data)
        dispatcher.add_method(self.load_schema)
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

    def load_data(self, str_data, table_name, infer, sch): # Load new data to dataset (removing old data)
        print "UPLOAD DATA:_____________________________________________________________"
        print str_data.encode('utf-8')
        print "_________________________________________________________________________"

        # Receive the data as string
        data=StringIO(str_data)
        df = pd.read_csv(data, sep=",")
        df.fillna("NaN", inplace=True)

       	table = self._tables[table_name]

        if (infer == True): table._schema = None
         
        table.data(df)

        _backend = MongoTable(table_name, table._schema, prefix='')
        _backend.data(df)

        return table._schema

    def concat_data(self, str_data, table_name): # Concat new data to current dataset
        # Receive the data as string
        data=StringIO(str_data)
        df = pd.read_csv(data, sep=",")
        df.fillna("NaN", inplace=True)

       	table = self._tables[table_name]
        
        from pprint import pprint
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

        return table._schema

    def load_schema(self, table_name, schema): # Load new schema
        # Receive the schema as string
        table = self._tables[table_name]

        # String to OrderedDict
        schema = json.loads(schema, object_pairs_hook=collections.OrderedDict)

        table._schema = TableSchema(schema['attributes'], schema['index'])

        return table._schema