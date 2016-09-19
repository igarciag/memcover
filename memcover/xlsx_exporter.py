# -*- coding: utf-8 -*-
'''
Created on 13/02/2014

@author: jmorales
'''

from indyva.facade.front import Front
from indyva.facade.showcase import Showcase
import pandas as pd
import os, json
from __init__ import ROOT

ASSETSPATH = os.path.join(ROOT, 'web', 'assets')


def export_dselect(dselect_name, dataset_name, fileName, excelCsv=False):
    dselect = Showcase.instance().get(dselect_name)
    dataset = Showcase.instance().get(dataset_name)

    project = dselect.projection

    # Multidimensial attributes are not exported in tables
    for name, attr in dataset.schema.attributes.items():
        if attr.is_multidimensional():
            project[name] = False

    if dselect.get_conditions():
        data = dataset.find(dselect.query, project).get_data('rows')
    else:
        data = dataset.get_data('rows')

    df = pd.DataFrame(data)
    df.fillna("NaN", inplace=True)

    if excelCsv == True:
        download_name = fileName.replace(" ", "_") + '.xlsx'
        df.to_excel(os.path.join(ASSETSPATH, 'exports', download_name), cols=dataset.schema.order, index=False)
    else:
        download_name = fileName.replace(" ", "_") + '.csv'
        df.to_csv(os.path.join(ASSETSPATH, 'exports', download_name), sep=',', encoding='utf-8', cols=dataset.schema.order, index=False)

    return os.path.join('assets', 'exports', download_name)


def export_schema(schema, fileName):
    result_schema = {'index': schema['index'], 'order': schema['order'], 'attributes': schema['attributes']}

    download_name = fileName.replace(" ", "_") + '_schema'
    with open(os.path.join(ASSETSPATH, 'exports', download_name), "w") as text_file:
        json.dump(result_schema, text_file)

    return os.path.join('assets', 'exports', download_name)


def expose_methods():
    Front.instance().add_method(export_dselect)
    Front.instance().add_method(export_schema)
