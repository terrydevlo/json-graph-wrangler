// Handles loading and saving files of various inputs (json/csv/xml) into various outputs (json/csv/xml)
import StrUtils from './string_utils.js';
import JsonCsvUtils from './json_csv_utils.js';

let fse;
let fs = require("fs");

let xmlParser;
try {

  if (!window) {
    require('fs');
    fse = require('fs-extra');
    xmlParser = require('xml2json');
  }
} catch (error) {
  require('fs');
  fse = require('fs-extra');
  xmlParser = require('xml2json');
}

export default class DataIO {
  constructor() {
    this.su = new StrUtils();
    this.jsonUtils = new JsonCsvUtils();

  }


  combine_paths(path1, path2 = "") {

    if (path2.includes("..")) {
      if (path1.slice(-1) === "/") {
        path1 = path1.slice(0, -1);
      }
      let path1dropPos = path1.lastIndexOf("/");
      path1 = path1.substring(0, path1dropPos);
      path2 = path2.substring(2);
    }
    // console.log("path1: ", path1);
    // console.log("path2: ", path2);
    return path1 + path2;
  }


  async get_files_in_directory(dirToCheck) {
    let ext;
    if (dirToCheck.includes('*')){
      ext = this.su.get_extension(dirToCheck);
      dirToCheck = this.su.extract_paths(dirToCheck);
    }

    // console.log("directory-to-check: ", dirToCheck);
    let filesInDir = fs.readdirSync(dirToCheck);

    if (ext){
      let outFiles = [];
      _.each(filesInDir, (file) => { if (file.includes(ext)) {  outFiles.push(file);  }} );
      filesInDir = outFiles;
      // console.log(filesInDir);
    }
    return filesInDir;
  }



  create_path_if_not_exist( newPath ){
    try{
      // console.log(" ATTEMPTING TO MAKE DIR: ", newPath);
      fs.mkdirSync(newPath);
    } catch (err){
      // console.log("error creating ", newPath);
    }
  }


  async load_file(file, p) {
    // check if directory
    if (!this.su.strip_paths(file).includes(".")) { // if no file name specified, derive from data
      let files = this.get_files_in_directory(file);
      console.log("files: ", files);
      throw new Error();
    }
    let extension = this.su.get_extension(file);
    // console.log("filename: ", filename);
    let outData;

    if (extension.toLowerCase().includes('csv')) {
      // handle csv
      return fetch(file, {
          method: 'get'
        })
        .then((response) => {
          return response.text();
        })
        .then((responseText) => {
          return this.jsonUtils.csv_data_to_array(responseText);
        })
        .then((responsearray) => {
          if (p && p['has_headers']) {
            return this.jsonUtils.array_to_json(responsearray);
          } else if (p && p['is_adjacency_matrix']) {
            return this.jsonUtils.adjacency_matrix_to_json(responsearray, p);
          } else if (p && p['is_hash_table']) {
            return this.jsonUtils.hash_table_to_json(responsearray);
          } else {
            return responsearray;
          }
        })
        .then((dataAsJSON) => {

          return dataAsJSON;
          // console.log( "aNewInputarray: ", aNewInputarray);
        });
    } else if (extension.toLowerCase().includes('tsv')) {
      //handle json files

      return fetch(file, {
          method: 'get'
        })
        .then((response) => {
          // console.log("fetched ", outFilename);
          let outJson = response.text();
          return outJson;
        })
        .then((responseText) => {
          return this.jsonUtils.tsv_data_to_array(responseText);
        })
        .then((responsearray) => {
          if (p && p['has_headers']) {
            // console.log("responsearray: ", responsearray);
            return this.jsonUtils.array_to_json(responsearray);
          } else if (p && p['is_adjacency_matrix']) {
            return this.jsonUtils.adjacency_matrix_to_json(responsearray);
          } else if (p && p['is_hash_table']) {
            return this.jsonUtils.hash_table_to_json(responsearray);
          } else {
            return responsearray;
          }
        })
        .then((dataAsJSON) => {
          return dataAsJSON;
        });

    } else if (extension.toLowerCase().includes('json')) {
      //handle json files

      return fetch(file, {
          method: 'get'
        })
        .then((response) => {
          let outJson = response.json();
          return outJson;
        })
        .then((responseJSON) => {
          return responseJSON;
        });

    } else if (extension.toLowerCase().includes('ml')) {
      // handle xml

      return fetch(file, {
          method: 'get'
        })
        .then((response) => {
          return response.text();
        })
        .then((responseText) => {
          // console.log("fetched ", outFilename);
          //
          // let oDOM = parser.parseFromString(responseText, "application/xml");
          // console.log("oDom: ", oDOM);
          let outJson = xmlParser.toJson(responseText);
          return outJson;
        });
    }
  }



  async save_data(filename, text, webRootDir) {
    // filename = '.' + filename;
    let path = this.su.extract_paths(webRootDir);
    this.create_path_if_not_exist(webRootDir);

    console.log("fileName: ", filename);
    let isJSON;

    if (filename.includes('.csv')) {
      isJSON = false;
      if (typeof(text) === 'object') {
        text = this.jsonUtils.convert_txt_json_to_csv(text);
      }
    } else if (filename.toLowerCase().includes(".json")) {
      isJSON = true;
      if (typeof(text) === 'object') {
        text = JSON.stringify(text, null, 3);
      }
    } else if (filename.toLowerCase().includes(".xml")) {
      console.log(text);
      text = xmlParser.toXml(text);
    }


    try {
      if (typeof document === undefined) {

        let element = document.createElement('a');
        if (isJSON) {

          element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));

        } else {
          element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        }
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);

      } else {
        console.log("saving ...", text);
        let endSubStrHere = __dirname.indexOf('src/');
        let localRoot = __dirname.substring(0, endSubStrHere);
        filename = filename.replace(webRootDir, localRoot);
        fse.outputFile(filename, text);

      }
    } catch (err) {
      console.log("writing err: ", err);
    }
  }
}