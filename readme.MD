# JSON Graph Wrangler
A node.js based library that maps csv / json / xml string data using a set of defined pipeline steps. A pipeline is defined in json (see pipeline folder) and specifies a sequential set of pipeline steps that describe input/output files, functions to transform the data, and parameters for those transformations. The library is written primarily to transform data into graph formats, including the ability to read connectivity matrices, find semantic links between entries and transform those into graphs. The library makes heavy use of the lodash js library.

## To run
1. Install packages. npm install
2. Copy input data to data folder.
3. Define pipeline to use in 'pipelines/main_pipeline.json'
4. Edit corresponding pipeline json in /pipelines/
5. Run pipeline. node starter.js

## Example pipelines
Example pipelines can be found in the pipeline folder. For a simple and flat pipeline, the 'bg_pipeline' is a good example. The bg-pipeline takes a connectivity matrix and transforms it into files of nodes and edges for import into a d3 library.

A more elaborate pipeline example that includes sub-pipelines can be found under 'tracts_pipeline'. This pipeline can be used to transform semantic biological data into ApiNATOMY graphs using tree and containment inference (https://github.com/open-physiology/open-physiology-viewer).