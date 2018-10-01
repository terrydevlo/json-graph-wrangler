// Infers pipeline steps to run, loads these in a way that makes a sequential
// pipeline work in a non-sequential (asynchronous) environment (node js)
const _ = require('lodash');

import PipelineStep from "./pipeline_step.js";
import DictArrUtils from "../dat_manip/dict_array_utils.js";
import DataTrans from "../dat_manip/data_trans.js";
import DataIO from "../dat_manip/data_io.js"
import StringUtils from "../dat_manip/string_utils.js"

export default class PipelineProcessor {
  constructor() {
    this.io = new DataIO();
    this.su = new StringUtils();
  }

  async process_pipeline(pipelineParams, pipelineStepsRoot, webRoot, dataRoot, localDir) {
    this.dataRoot = dataRoot;
    this.webRoot = webRoot;
    this.localDir = localDir;
    let preparedSteps = this.prepare_steps(pipelineParams, pipelineStepsRoot);

    // console.log("Finished preparing ", preparedSteps.length, " steps ");
    // console.log("preparedSteps: ", preparedSteps);

    for (const pStp of preparedSteps) {
      await this.process_step(dataRoot, pStp['ioMap'], pStp['stepFileName'], pStp['pipelineStepsRoot'], webRoot);
    }

    this.su.cl("finished processing all steps.");
    // await this.prepare_step(pp, ioMap, stepFileName, pipelineStepsRoot);

  }

  prepare_steps(pipelineParams, pipelineStepsRoot) {
    let pipeFlags = this.set_pipeline_flags(pipelineParams);

    let preparedSteps = [];
    // console.log("pipelineParams: ", pipelineParams);
    // throw new console.error();

    _.forOwn(pipelineParams, async (pipelineStep, pipelineName) => {

      // traverse step params and io
      _.forOwn(pipelineStep, async (ioMap, stepFileName) => {

        let thisStep = {};
        let shouldRunStep;

        [pipeFlags, shouldRunStep] = this.should_run_step(pipeFlags, ioMap);

        if (shouldRunStep) {

          thisStep['ioMap'] = ioMap;
          thisStep['stepFileName'] = _.clone(stepFileName);
          thisStep['pipelineStepsRoot'] = _.clone(pipelineStepsRoot);
          preparedSteps.push(thisStep);

        }

      });
    });

    return preparedSteps;
  }

  async build_io_map( ioMap ) {
    // console.log("TO BUILD: ", ioMap);

    let tempNewFiles;
    let newInputFiles = [];
    let newOutFiles
    let inputDatRoot = this.io.combine_paths(__dirname, this.localDir);

    let addFiles = async (ioMap) => {
      _.each(ioMap['input'], async (inputFile) => {

        if (inputFile.includes('*')  || !inputFile.includes(".")) {
          let newInputFile = inputDatRoot + inputFile;
          let fileListPromise = Promise.resolve(this.io.get_files_in_directory( newInputFile ));
          await fileListPromise.then(filesInDir => {
            let withDir = [];
            let expIoMap = {};

            _.each(filesInDir, (entry) => {
              let outEntry = _.clone(entry);
              outEntry = this.su.extract_paths(inputFile) + entry;
              withDir.push(outEntry);

              console.log("this.su.extract_filename(inputFile): ", this.su.extract_filename(outEntry));

              if (ioMap['output'].includes("*") || !ioMap['output'].includes(".")){
                let fullOutputPath = inputDatRoot + ioMap['output'];
                this.io.create_path_if_not_exist( fullOutputPath );

                let newOutputFile = this.su.extract_paths(ioMap['output']) + this.su.extract_filename(outEntry) + ".json";
                expIoMap[outEntry] = newOutputFile;
              }
            });
            if (withDir.length > 0) {
              newInputFiles = _.concat( newInputFiles, withDir );
              ioMap['input'] = newInputFiles;

              console.log("1 newInputFiles: ", newInputFiles);
            }
            if (!_.isEmpty(expIoMap)){
              ioMap['expIoMap'] = expIoMap;
            }

          });
        } else {
          newInputFiles.push(inputFile);
          ioMap['input'] = newInputFiles;
        }
      });
      console.log("io map: ", ioMap);
    }


    let promiseDone = Promise.resolve(addFiles(ioMap));
    await promiseDone.then(dat => {
      // console.log("newInputFiles: ", newInputFiles);
    });
    console.log("ioMap: ", ioMap);

    return ioMap;

  }

  async reject_delay() {
    let t = 1500;
    return new Promise((resolve, reject) => {
      setTimeout((t) => {
        console.log("Retrying ...")
      });
    });
  }

  async await_delay() {
    let t = 1500;
    // return new Promise((resolve, reject) => {
      setTimeout((t) => {
        console.log("Waiting ...")
      });
    // });
  }


  set_pipeline_flags(pipelineParams) {
    let pp = {};
    pp['hasStartFlag'] = false;
    pp['startFlagTriggered'] = false;
    pp['hasEndFlag'] = false;
    pp['endFlagTriggered'] = false;
    pp['hasOnlyOneStep'] = false;

    // console.log("__set_pipeline_flags__ :", pipelineParams);
    // throw new Error();
    // Analyse pipeline to see if it contains start/end flags
    _.forOwn(pipelineParams, (pipelineStep, pipelineName) => {
      // _.each(pipelineSteps, (pipelineStep) => {
      // console.log("pipelineStep___  : ");
      // console.log(pipelineStep);

      // throw new Error();
      let ioMapKeys = _.values(pipelineStep)[0];
      // console.log("ioMapKeys: ", ioMapKeys);
      // this.su.cl("ioMapKeys: ", ioMapKeys);
      if (ioMapKeys["start"]) {
        pp['hasStartFlag'] = true;
      }
      if (ioMapKeys["end"]) {
        pp['hasEndFlag'] = true;
      }
      if (ioMapKeys["run_only_this_step"]) {
        pp['hasOnlyOneStep'] = true;
      }
      // });
    });

    return pp;
  }

  should_run_step(pp, ioMap) {

    let shouldRunStep = true;

    if (pp['hasStartFlag'] && !pp['startFlagTriggered']) {
      if (ioMap['start']) {
        pp['startFlagTriggered'] = true;
        pp['hasStartFlag'] = false;
      } else {
        shouldRunStep = false;
      }
    }

    if (pp['hasEndFlag']) {
      if (pp['endFlagTriggered']) {
        shouldRunStep = false;
      }
      if (ioMap['end']) {
        pp['endFlagTriggered'] = true;
      }
    }

    if (pp['hasOnlyOneStep']) {

      if (!ioMap['run_only_this_step']) {
        shouldRunStep = false;
      }
    }

    if (ioMap['exclude_step']) {
      shouldRunStep = false;
    }

    return [pp, shouldRunStep];
  }


  async process_step(dataRoot, ioMap, stepFileName, pipelineStepsRoot, webRoot, x) {
    // check whether to run pipeline step
    console.log('ioMap: ', ioMap);

    return new Promise(async resolve => {

      this.su.cl('   ');
      console.log("===== MAIN STEP process_step: ", stepFileName);
      let stepFinished = false;

      let loadedPromise;
      if (stepFileName.includes(".json")) {

        let pipelineFilenameAndRoot = pipelineStepsRoot + stepFileName;
        loadedPromise = await Promise.resolve(this.io.load_file(pipelineFilenameAndRoot, ioMap));

      } else {
        let outP = {};
        let outPP = {};
        outPP[stepFileName] = ioMap['p'];
        outP[stepFileName] = [outPP];
        loadedPromise = Promise.resolve(outP);
      }

      await loadedPromise.then(async (subStepParams) => {
        // console.log("subStepParams: ", subStepParams);
        // this.su.cl("subStepParams: ", subStepParams);
        console.log("subStepParams: ", subStepParams);
        let fn = async (file) => { // sample async action
          let fileAndPath = dataRoot + file;
          console.log(fileAndPath);
          let dataIO = new DataIO();
          // console.log("file: ", file);
          return Promise.resolve(dataIO.load_file(fileAndPath, ioMap));
        };

        let ioMapPromise = Promise.resolve( this.build_io_map( ioMap, subStepParams ));

        ioMapPromise.then(async builtIO => {
          ioMap = builtIO;

          let mapLoadInput = ioMap['input'].map(fn);
          let allInputDataPromise = Promise.all(mapLoadInput);

          // this.su.cl("allInputDataPromise.");
          let inputDataMap = {};
          let funcData = {};
          await allInputDataPromise.then(async (inputData) => {
            let outputLoc;
            let pipelineStepInstance = new PipelineStep(dataRoot, webRoot);
            let inputDataMap = _.zipObject(ioMap['input'], inputData);
            let dataTransInstance = new DataTrans();

            await this.await_delay().then(() => {

              if (!_.keys(ioMap).includes('expIoMap')){
                // console.log("subStepParams: ", subStepParams);
                let processedStep = pipelineStepInstance.run_step(subStepParams, inputDataMap, ioMap['output']);
                // this.su.cl("finished allInputDataPromise." );
                resolve(x);
              } else {
                _.forOwn(ioMap['expIoMap'], (outFile, inFile) => {
                  // console.log("outFile: ", outFile, " infile: ", inFile);

                  let processedStep = pipelineStepInstance.run_step(subStepParams, inputDataMap, [outFile], [inFile]);
                  // this.su.cl("finished allInputDataPromise." );
                });
                resolve(x);
              }
            });

          }, async () => {
            await this.reject_delay().then(resolve(x)).catch(resolve(x))
          });
          console.log(stepFileName, " loadedPromise.");
        })

      });
      // this.su.cl("finished pipelineStepInstance! output.");
    }, reject => {
      this.su.cl("rejected!")
    });

  }

}