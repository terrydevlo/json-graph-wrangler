// Highermost pipeline handling.
'use strict';
require('es6-promise').polyfill();
require('isomorphic-fetch');
require('console-error');
require('cli-color');
require('json-markup');
require('esm');
require('prettyjson');

let webRoot = 'http://127.0.0.1:8080/';
let dataRootDir = webRoot + 'data/';
let outDataRoot = "./data/";
let localDir = "../../data/";

let pipelineRoot = webRoot + 'pipelines/';

import PipelineProcessor from './process_pipeline.js';
import StringUtils from '../dat_manip/string_utils.js';
import DictArrUtils from '../dat_manip/dict_array_utils.js';

import DataIO from '../dat_manip/data_io.js';

let dataIO = new DataIO();
let su = new StringUtils();
let da = new DictArrUtils();

let mainPipelineParamsFile = pipelineRoot + 'main_pipeline.json';
console.log("mainPipelineParamsFile: ", mainPipelineParamsFile);

let pipelineToRunPromise = Promise.resolve(dataIO.load_file(mainPipelineParamsFile));
pipelineToRunPromise.then((pipelineToRunObj) => {
  let pipelinesToRun = pipelineToRunObj['pipeline_to_run'];
  pipelinesToRun = da.make_arr_if_not(pipelinesToRun);
  _.each(pipelinesToRun, (pipelineToRun) => {

    let pipelineToRunFile = pipelineToRun + '.json';
    let pipelineToRunPath = pipelineToRun;

    pipelineRoot += pipelineToRunPath + "/";
    let pipelineToRunPathAndFile = pipelineRoot + pipelineToRunFile;

    console.log("pipelineToRunPathAndFile: ", pipelineToRunPathAndFile);

    let loadedMainPromise = Promise.resolve(dataIO.load_file(pipelineToRunPathAndFile));
    loadedMainPromise.then(async (mainPipe) => {

      console.log(" == starting pipe **.** ", pipelineToRun);

      let subPipelines = mainPipe[pipelineToRun];
      // _.forOwn(subPipelines, async (subPipeline) => {
      let pipelineKeys = (_.keys(subPipelines));

      // if (_.isArray(pipelineKeys) ){
      //   console.log("_.values(subPipelines)[0]: ", _.values(subPipelines)[0]);
      //   console.log("_.values(subPipelines)[1]: ", _.keys(_.values(_.values(subPipelines)[0])[0]));
      let inUltimatePipeSteps = false;
      if (_.isArray(pipelineKeys)) {
        if (_.keys(_.values(_.values(subPipelines)[0])[0]).includes("input")) {
          inUltimatePipeSteps = true;
        }
      }

      if (inUltimatePipeSteps){
          let pipelineProcessorInstance = new PipelineProcessor();
          let pipelineStepsRoot = pipelineRoot + su.extract_filename(pipelineToRunPathAndFile) + '/';
          // console.log("pipelineStepsRoot: ", pipelineStepsRoot);
          await pipelineProcessorInstance.process_pipeline(_.values(subPipelines), pipelineStepsRoot, webRoot, dataRootDir, localDir);
      } else {
        for (const subPipeline of subPipelines) {
          // console.log("--SUB PIPE-- ", subPipeline);
          let pipelineProcessorInstance = new PipelineProcessor();

          if (subPipeline['run']) {
            let subPipelineFile = subPipeline['pipeline'];
            let subPipelineFileAndPath = pipelineRoot + subPipelineFile;
            let pipelineStepsFolder = su.extract_filename(subPipelineFile);
            let pipelineStepsRoot = pipelineRoot + pipelineStepsFolder + '/';

            // console.log("[] Secondary pipeline step ", pipelineStepsRoot);
            // // throw new Error();
            // console.log("subPipelineFileAndPath: ", subPipelineFileAndPath);
            let loadedPipePromise = Promise.resolve(dataIO.load_file(subPipelineFileAndPath));
            await loadedPipePromise.then(async (subPipelineParams) => {
              await pipelineProcessorInstance.process_pipeline(subPipelineParams, pipelineStepsRoot, webRoot, dataRootDir, localDir);
            });
          }
        }
      }
    });

  });

});