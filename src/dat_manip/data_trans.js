// Handles transforming and mapping of data 

import 'lodash';
import DataIO from './data_io.js';
import StringUtils from './string_utils.js';

import TreeUtils from './tree_utils.js';
import DictArrUtils from "./dict_array_utils.js";
import DataSelect from "./data_select.js";
import ObjMatching from "./object_matching.js";


export default class DataTrans {

  constructor() {
    this.da = new DictArrUtils();
    this.om = new ObjMatching();
    this.ds = new DataSelect();
    this.io = new DataIO();
    this.su = new StringUtils();
  }

  // ripe for rewriting, this function does two things.
  // checks to see if value exists as a key, if so, takes value from keys
  // else replace
  map_single_key(entry, entryKeys, newVal, newKey) {

    if (entryKeys.includes(newVal)) {
      newVal = entry[newVal];
      if (newVal.toLowerCase() !== newKey.toLowerCase()) {
        delete entry[newVal];
      }
    }
    entry[newKey] = newVal;

    if (_.isString(entry[newKey])) {
      entry[newKey] = entry[newKey].trim();
    }

    // console.log("entrykeys: ", entryKeys, " oldProp: ", oldProp, " newProp: ", newProp, " replaceKeyName: ", replaceKeyName, " addPropertyAsConstant: ", addPropertyAsConstant);

    return entry;

  }



  map_keys_if(inDat, p) {
    console.log("map_keys_if: ");
    let deleteUnspecifiedKeys = false;
    if (_.keys(p).includes('deleteUnspecifiedKeys')) {
      deleteUnspecifiedKeys = p['deleteUnspecifiedKßeys'];
      delete p['deleteUnspecifiedKeys'];
    }

    let ifValueIsStr = true;

    if (_.keys(p).includes('if_value_is_string')) {
      ifValueIsStr = p['if_value_is_string'];
      delete p['if_value_is_string'];
    }

    return _.each(inDat, (entry) => {
      // console.log("entries Vals: ", entriesVal, " entriesKeys: ", entriesKey );
      let propKeys = _.keys(p);
      let entryKeys;

      _.forOwn(p['keys_to_map'], (keyToGetVal, keyToChange) => {
        if (ifValueIsStr) {
          if (isNaN(Number(entry[keyToGetVal]))) {
            entry[keyToChange] = entry[keyToGetVal];
          }
        }
      });

      return entry;
    });
  }

  create_arrays_from_files(dat, p) {
    let outDat = {};
    _.forOwn(dat, (val, key) => {
      let newKey = this.su.extract_filename(key);

      outDat[newKey] = val;
    });

    return outDat;
  }


  map_valStr_from_array_of_keys(entry, arrayOfKeys) {
    let entryKeys = _.keys(entry);
    let outputArr = [];

    _.each(arrayOfKeys, (arrayEl) => {
      let valStr;
      if (_.includes(entryKeys, arrayEl)) {
        valStr = entry[arrayEl];
      } else {
        valStr = arrayEl;
      }
      if (_.isString(valStr)) {
        valStr = _.trim(valStr);
      }
      outputArr.push(valStr);
    });

    let outputStr = _.join(outputArr, ' ');
    return outputStr;
  }


  map_keys_to_keys_nested(data, p, firstGo) {
    if (!firstGo){
      firstGo = "yes";
    } else {
      firstGo = "no";
    }
    // console.log(data)
    // console.log(typeof(data));
    let outData;
    if (_.isArray(data)) {
      let outEntries = [];

      _.each(data, (entry) => {
        // console.log("entry: ", typeof(entry));

        if (_.isPlainObject(entry)) {
          let entryKeys = _.keys(entry);
          let outEntry = this.da.map_objects_to_str_or_existing_key(entry, p['new_key_val_pairs'], p['onlyIfKeyFound']);
          entry = _.clone(outEntry);
        } else if (_.isArray(entry)) {
          entry = this.map_keys_to_keys_nested(entry, p, firstGo);
        }

        outEntries.push(entry);

      });
      outData = _.clone(outEntries);
    } else if (_.isPlainObject(data)) {
      let outEntry = this.da.map_objects_to_str_or_existing_key(data, p['new_key_val_pairs'], p['onlyIfKeyFound']);
      data = _.clone(outEntry);

      _.forOwn(data, (val, key) => {
        if (_.isArray(val)) {
          data[key] = this.map_keys_to_keys_nested(val, p, firstGo);
        }
      });

      outData = _.clone(data);
    } else {
      outData = _.clone(data);
    }
    if (firstGo==="yes"){
      // console.log(outData);

    }

    return outData;
  }


  map_keys_to_keys(data, p, deleteUnspecifiedKeys) {
    if (_.keys(p).includes('deleteUnspecifiedKeys')) {
      deleteUnspecifiedKeys = p['deleteUnspecifiedKßeys'];
      delete p['deleteUnspecifiedKeys'];
    }

    return _.each(data, (entry) => {
      // console.log("entries Vals: ", entriesVal, " entriesKeys: ", entriesKey );
      let propKeys = _.keys(p);
      let entryKeys;

      _.mapKeys(p, (newProp, oldProp) => {
        entryKeys = _.keys(entry);

        // console.log("oldprop: ", oldProp, " newProp: ", newProp);
        if (Array.isArray(newProp)) {
          // console.log("entry: ", entry);
          newProp = this.map_valStr_from_array_of_keys(entry, newProp);
          // throw new Error();
        }

        if (oldProp) {
          entry = this.map_single_key(entry, entryKeys, newProp, oldProp);
        }
        // console.log("newEntry: ", entry);
      });

      if (deleteUnspecifiedKeys) {
        entryKeys = _.keys(entry);
        let keysToRemove = entryKeys.filter(key => !propKeys.includes(key));
        _.each(keysToRemove, function(keyToRemove) {
          delete entry[keyToRemove];
        });
      }

      return entry;
    });
  }

  map_keys_to_values(data, p) {
    let outObj = [];
    // console.log("in data!");
    // console.log(data);

    if (Array.isArray(data)) {
      // each data entry map its key as a name value and its children as an array of children
      _.each(data, (entry) => {

        // console.log("ARR: ", _.keys(entry));
        _.forOwn(entry, (val, key) => {
          console.log("entry: ", entry);
          let newObj = {};

          newObj[p["new_key"]] = key;
          let valKeys = _.keys(val);
          if (valKeys.length > 0) {
            newObj[p["new_value_key"]] = this.map_keys_to_values(val, p);
          }
          outObj.push(newObj);
        });
      });

    } else if (_.isPlainObject(data)) {

      _.forOwn(data, (val, key) => {
        // console.log("key: ", key)
        let newObj = {};
        // if (key !== p[ "new_key" ] && key !== p[ "new_value_key" ]){

        newObj[p["new_key"]] = key;

        let valKeys = _.keys(val);

        if (valKeys.length > 0) {
          newObj[p["new_value_key"]] = this.map_keys_to_values(val, p);
        }
        outObj.push(newObj);
      });

    }
    return outObj;
  }

  transpose_key_vals_to_new_labels(data, p, matched) {

    let outObj;
    let pKeyValArr = p['match_any_keyval_as_array'];
    let pValArr = p['match_any_val_as_array'];


    if (_.isArray(data)) {
      // each data entry, map its key as a name value and its children as an array of children
      outObj = [];

      _.each(data, (entry) => {
        if (matched) {

          let newObj = {};

          newObj[pValArr["new_string_key"]] = _.keys(entry)[0];
          newObj[pValArr["new_string_val_key"]] = _.values(entry)[0];;

          entry = newObj;

        } else if (_.isPlainObject(entry)) {
          entry = this.transpose_key_vals_to_new_labels(entry, p, false);

        }
        outObj.push(entry);

      });

    } else if (_.isPlainObject(data)) {


      _.forOwn(data, (val, key) => {
        matched = false;
        if (_.isArray(val)) {
          matched = true;
          // console.log("k: ", key, " v: ", _.keys(val));
          let newObj = {}

          if (pKeyValArr) {
            newObj[pKeyValArr["new_string_key"]] = key;
            newObj[pKeyValArr["new_string_val_key"]] = val;
          }

          if (pValArr) {
            newObj[pKeyValArr["new_string_val_key"]] = this.transpose_key_vals_to_new_labels(val, p, matched);
          }
          if (!outObj) {
            outObj = this.da.make_arr_if_not(newObj);
          } else {
            outObj = _.concat(outObj, this.da.make_arr_if_not(newObj));
          }

        } else if (_.isPlainObject(val) || _.isArray(val)) {
          outObj[key] = this.transpose_key_vals_to_new_labels(val, p, matched);
        }
        // console.log(_.values(outObj)[0]);

      });

    }
    return outObj;
  }


  swop_key_vals( data, p) {

    let outObj;

    if (_.isArray(data)) {
      // each data entry, map its key as a name value and its children as an array of children
      outObj = [];

      _.each(data, (entry) => {
       if (_.isPlainObject(entry)) {
          entry = this.swop_key_vals(entry, p);
        }
        outObj.push(entry);
      });

    } else if (_.isPlainObject(data)) {

      outObj = {}
      _.forOwn(data, (val, key) => {
        outObj[val] = key;
      });

    }
    return outObj;
  }


  extract_uniques_and_map(data, p, deleteUnspecifiedKeys) {
    if (_.keys(p).includes('deleteUnspecifiedKeys')) {
      deleteUnspecifiedKeys = p['deleteUnspecifiedKeys'];
      delete p['deleteUnspecifiedKeys'];
    } else if (deleteUnspecifiedKeys === undefined || deleteUnspecifiedKeys === null) {
      deleteUnspecifiedKeys = true;
    }

    let [uniqueEntries, cleanedp, uniqueKeys] = this.ds.get_uniques(data, p);

    // console.log("uniqueEntries: ", uniqueEntries.length );

    let newOutData = this.map_keys_to_keys(uniqueEntries, cleanedp, deleteUnspecifiedKeys);
    // console.log("unique and mapped: ", newOutData.length);
    // this.da.print_keys(newOutData, "");

    return [newOutData, uniqueKeys];
  }




  join_values_of_specified_keys(dat, p) {
    let outDat = [];
    let allValsValid = false;
    let outEntryVals;
    let outVal;
    // console.log("dat: ", dat);
    _.each(dat, (entry) => {

      // _.join for joining strings, _.pick for selecting specific keys
      // _.values for returning only valuesToSearchFor
      // _.unique for returning uniqueEntries
      // _.compact for removing ''
      outEntryVals = _.values(_.pick(entry, p['keys_to_join']));
      console.log(outEntryVals);
      allValsValid = true;

      if (p['all_values_need_be_defined']) {
        _.each(outEntryVals, (outEntryVal) => {
          if (!outEntryVal || outEntryVal === "") {
            allValsValid = false
          }
        });
      }
      if (p['matching_obj']) {
        allValsValid = this.om.check_obj_matches(entry, p['matching_obj']);
        // console.log(entry, " matches");
      }
      if (allValsValid) {
        // console.log(allValsValid, " matches");

        // console.log("valid entry: ", _.keys(entry));
        outVal = _.join(outEntryVals, " ");
        if (p['new_key']) {
          entry[p['new_key']] = outVal;
          // console.log("pushing: ", entry);
          outDat.push(entry);
        } else {
          outDat.push(outVal);
        }
      }
    });
    if (p['only_uniques']) {

      // handle object uniques differently
      if (p['new_key']) {
        if (p['delete_unspecified_keys']) {
          p['keys_to_select'] = _.concat(p['keys_to_join'], p['new_key']);
          // console.log("select_subset_of_keys_from_arr: ", p)
        }
        // this.su.cl( outDat.length);
        outDat = this.ds.select_subset_of_keys_from_arr(outDat, p);
        outDat = _.uniqBy(outDat, p['new_key']);


      } else {
        // this.su.cl( outDat.length);
        outDat = _.uniq(outDat);
        // this.su.cl( outDat.length);

      }

    }
    this.su.cl(outDat);
    return _.compact(outDat);
  }


  append_suffix_to_key(inDat, p) {
    let outDat = [];
    _.each(inDat, (entry) => {
      _.forOwn(p, (val, key) => {
        entry[key] += val;
      });
      outDat.push(entry);
    });
    return outDat;
  }


  append_str_to_arr(inArr, p) {
    let outArr = [];
    _.each(inArr, (entry) => {
      if (p['suffix']) {
        entry += " " + p['suffix'];
      }
      if (p['prefix']) {
        entry = p['prefix'] + " " + entry;
      }
      outArr.push(entry);
    });
    return outArr;
  }

  // map in order of keys supplied
  map_arr_to_obj(inArr, p) {
    let outObjs = [];
    _.each(inArr, (item) => {
      if (!_.isArray(item)) {
        item = [item]
      }

      let outObj = _.zipObject(p['keys'], item);
      outObjs.push(outObj);
    });
    return outObjs;
  }



  map_values_to_values(data, p, refDat) {

    return _.each(data, function(entry) {
      _.forOwn(p, function(valueMapping, key) {
        _.forOwn(valueMapping, function(newVal, oldVal) {
          if (entry[key] === oldVal) {
            entry[key] = newVal
          };
        });
      });
    });
  }

  map_values_to_values_nested(data, p, refDat, origPs) {
    let outObj;

    if (!origPs){
      origPs = p;
    }

    if (refDat){
      p = refDat;
    }

    if (_.isArray(data)) {
      outObj = [];
      let outEntry;
      // each data entry, map its key as a name value and its children as an array of children
      _.each(data, (entry) => {
        outEntry = _.clone(entry);
        if (_.isArray(entry) || _.isPlainObject(entry)) {
          outEntry = this.map_values_to_values_nested(entry, p, refDat, origPs);
        }
        outObj.push(outEntry);
      });

    } else if (_.isPlainObject(data)) {
      outObj = _.clone(data);
      _.forOwn(data, (val, key) => {
        if (_.isArray(val) || _.isPlainObject(val)) {
          outObj[key] = this.map_values_to_values_nested(val, p, refDat, origPs);
        } else if ((p[val])) {
          if ( !origPs['exclude_keys'] || !origPs['exclude_keys'].includes(key) ){
            if ( !origPs['from_keys'] || origPs['from_keys'].includes(key) ){
              outObj[key] = p[val];
            }
          }
        }

      });
    }

    return outObj;
  }




  replace_str_values(data, p) {
    let outObj;
    let keyValPs = p['replace_str_params'];

    if (_.isArray(data)) {
      outObj = [];

      // each data entry, map its key as a name value and its children as an array of children
      _.each(data, (entry) => {
        let outEntry = _.clone(entry);
        if (_.isArray(entry) || _.isPlainObject(entry)) {
          outEntry = this.replace_str_values(entry, p);
        }
        outObj.push(outEntry);
      });

    } else if (_.isPlainObject(data)) {
      outObj = _.clone(data);
      let replacementStr;
      _.forOwn(data, (val, key) => {

        let keyValMatches=true;
        if (_.isString(val)) {
          replacementStr = _.clone(val);

          if (keyValPs){
            _.each(keyValPs, (keyValP) => {
              keyValMatches = true;
              if (keyValP['key_val_matching']) {
                keyValMatches = this.om.check_key_val_matches(key, replacementStr, keyValP['key_val_matching']);
              }

              if (keyValMatches) {
                replacementStr = this.su.modify_str(replacementStr, p);

                outObj[key] = _.clone(replacementStr);
              }
            });
          } else {
            replacementStr = this.su.modify_str(replacementStr, p);
            if (!p['new_key']){
              outObj[key] = _.clone(replacementStr);
            } else {
              outObj[p['new_key']] = _.clone(replacementStr);
            }
          }



        } else {

          if (_.isArray(val) || _.isPlainObject(val)) {
            outObj[key] = this.replace_str_values(val, p);
          }
        }
      });
    } else {
      outObj = _.clone(data);
    }

    return outObj;
  }


  replace_matching_values(data, p) {
    let outObj;

    if (_.isArray(data)) {
      outObj = [];

      // each data entry, map its key as a name value and its children as an array of children
      _.each(data, (entry) => {
        let outEntry = _.clone(entry);
        if (_.isArray(entry) || _.isPlainObject(entry)) {
          outEntry = this.replace_matching_values(entry, p);
        }
        outObj.push(outEntry);
      });

    } else if (_.isPlainObject(data)) {
      outObj = _.clone(data);

      _.forOwn(data, (val, key) => {

        let keyValMatches = false;
        if (_.isString(val)) {
          keyValMatches = false;
          if (val === p['string_val']) {
            outObj[key] = p['replace_with_this'];
          }

        } else if (_.isArray(val) || _.isPlainObject(val)) {
          outObj[key] = this.replace_matching_values(val, p);
        }
      });
    } else {
      outObj = _.clone(data);
    }

    return outObj;
  }


  sanitise_all_values(data) {

    if (_.isArray(data)) {
      let outArray = [];
      _.each(data, function(entry) {
        outArray.push(sanitise_all_values(entry))
      });
      return outArray;

    } else if (_.isObject(data)) {
      let outObj = {};
      _.forOwn(data, function(val, key) {
        if (_.isString(val)) {
          outObj[key] = _.capitalize(_.trim(val));
        } else if ((_.isObject(data) || _.isArray(data))) {
          outObj[key] = sanitise_all_values(val);
        } else {
          outObj[key] = val;
        }
      });
      return outObj;
    }
    // this.da.print_keys(data, "");
    // return data;
  }


  rename_keys(data, p) {

    // this.da.print_keys(data, "");
    let outData;

    let currKeys;
    outData = _.each(data, (entry) => {
      currKeys = _.keys(entry);
      return _.forOwn(p, (newKey, oldKey) => {

        // don't override if the key already exists in entry
        if (!currKeys.includes(newKey)) {

          // otherwise replace key
          let oldVal = entry[oldKey];
          delete entry[oldKey];
          if (oldVal === undefined) {
            entry[newKey] = "";
          } else {
            entry[newKey] = oldVal;
          }
          delete entry[oldKey];
        }
        return entry;
      });
    });

    return outData;
  }

  get_matching_entry(data, valToSearch) {
    let matchedItem;
    _.each(data, function(item) {
      // console.log("valToSearch: ", valToSearch);
      // console.log("typeof: ", typeof(item));
      let match = false;
      _.forOwn(item, (value, key) => {
        // console.log("value: ", value, "key: ", key, " ", key.length);
        if (key === 'ID') {
          console.log("ID: ", key);
          if (valToSearch === value) {
            matchedItem = item;
            // console.log("matched! ", matchedItem);
          }
        }
      });

    });
    return matchedItem;
  }





  map_names_from_ids(data, p) {

    let valuesToSearchFor;
    let matchingEntry;
    let outputEntries = _.each(data, (entry) => {
      _.forOwn(entry, (value, key) => {
        if (key.toLowerCase() !== 'id') {

          if (this.su.has_numbers(value)) {
            if (!isNaN(Number(value))) {
              valuesToSearchFor = [value];
            } else {
              valuesToSearchFor = value.split(',');

            }

            let matchingEntries = []
            _.each(valuesToSearchFor, (valToSearch) => {
              valToSearch = valToSearch.trim();

              if (!isNaN(Number(valToSearch))) {
                matchingEntry = _.find(data, [p['id_key'], valToSearch]);
                // console.log("entry ", key, " v: ", entry[key]);

                if (matchingEntry) {
                  matchingEntries = _.concat(matchingEntries, [matchingEntry['name']]);
                }
              }
            });

            if (matchingEntries.length > 0) {
              entry[key] = matchingEntries;
            }
          }
        }
      });
      return entry;
    });

    return outputEntries;
  }



  delete_properties(data, keysToDelete) {
    // console.log(typeof(data));
    if (_.isArray(data)) {
      let outEntries = [];
      _.each(data, (entry) => {
        // console.log("entry: ", typeof(entry));

        if (_.isPlainObject(entry)) {

          entry = _.omit(entry, keysToDelete);

          _.forOwn(entry, (val, key) => {
            if (_.isArray(val) || _.isPlainObject(val)) {
              // console.log("val: ", val);
              entry[key] = this.delete_properties(val, keysToDelete);
            }
          });
        } else if (_.isString(entry)) {
          // console.log("i'm actually a string!");
          // console.log(typeof(data));
        } else if (_.isObject(entry)) {
          entry = _.omit(entry, keysToDelete);
          entry = this.delete_properties(entry, keysToDelete);
        }
        // console.log("outEntry: ", entry);
        outEntries.push(entry);

      });
      return outEntries;
    } else if (_.isObject(data)) {
      let outData = _.clone(outData)
      outData = _.omit(data, keysToDelete);
      _.forOwn(outData, (val, key) => {
        if (_.isArray(val) || _.isPlainObject(val)) {
          // console.log("val: ", val);
          outData[key] = this.delete_properties(val, keysToDelete);
        }
      });
      return outData;
    }
  }



  map_keys_to_keys_for_ordering(data, keysToMap) {
    // console.log(typeof(data));
    if (_.isArray(data)) {
      let outEntries = [];
      _.each(data, (entry) => {

        if (_.isPlainObject(entry)) {
          let newEntry = {};
          let entryKeys = _.keys(entry);
          _.each(keysToMap, (keyToMap) => {
            if (entryKeys.includes(keyToMap)) {
              newEntry[keyToMap] = _.clone(entry[keyToMap]);
            }
          });
          _.forOwn(entry, (val, key) => {
            if (_.isArray(val) || _.isPlainObject(val)) {
              // console.log("val: ", val);
              newEntry[key] = this.map_keys_to_keys_for_ordering(val, keysToMap);
            } else {
              newEntry[key] = val;
            }
          });
          entry = _.clone(newEntry);
        } else if (_.isObject(entry)) {
          entry = this.map_keys_to_keys_for_ordering(entry, keysToMap);
        }
        outEntries.push(entry);

      });
      return outEntries;
    } else if (_.isPlainObject(data)) {
      let newEntry = {};
      let entryKeys = _.keys(data);
      _.each(keysToMap, (keyToMap) => {
        if (entryKeys.includes(keyToMap)) {
          newEntry[keyToMap] = data[keyToMap];
        }
      });
      // console.log("newEntry: ", newEntry);
      _.forOwn(data, (val, key) => {
        if (_.isArray(val) || _.isPlainObject(val)) {
          // console.log("val: ", val);
          newEntry[key] = this.map_keys_to_keys_for_ordering(val, keysToMap);
        } else {
          newEntry[key] = val;
        }
      });
      return newEntry;
    } else {
      return data;
    }
  }



  map_and_assign_matching(inDataSets, origData, p) {
    if (_.isEmpty(inDataSets)) {
      inDataSets = origData;
    }

    let primaryKeys = p['primary_keys'];
    let dataSetKeys = _.keys(inDataSets);
    if (dataSetKeys.length == 1) {
      return inDataSets[dataSetKeys];
    }

    let primeDatasetKey = dataSetKeys[0];

    let mergedDataset = inDataSets[primeDatasetKey];

    let keysInPrimaryDataset = _.keys(mergedDataset[0]);
    // console.log("keysInPrimaryDataset: ", keysInPrimaryDataset);

    // Remove prime dataset from keys
    delete inDataSets[primeDatasetKey];

    // concatenate datasets that have the exact same keys as primary keys
    _.forOwn(inDataSets, (val, key) => {
      if (_.xor(_.keys(val[0]), keysInPrimaryDataset).length === 0) {

        mergedDataset = _.concat(mergedDataset, val);
        delete inDataSets[key];
      }
    });


    let relevantKeys = [];

    let outKey;
    let refinedKeys = [];
    let keysInDataset = [];


    // Refine keys to match from file names (remove directories and trailing 's')
    _.forOwn(inDataSets, (dataset, datasetKey) => {
      let refinedDatasetKey = datasetKey.split('/').pop().split('.json').shift().toLowerCase().slice(0, -1);

      // let keysInDataset = _.keys(dataset[0]);

      _.each(keysInPrimaryDataset, (key) => {
        if (refinedDatasetKey.includes(key)) {
          refinedKeys.push(key);
          inDataSets[key] = inDataSets[datasetKey];
          delete inDataSets[datasetKey];
        }
      });
    });


    // map merged dataset
    let flattened = [];
    _.each(mergedDataset, (entry) => {
      // console.log(" entry: ", entry );
      _.forOwn(inDataSets, (dataset, datasetKey) => {

        // defaults deep is merging arrays
        entry = _.defaultsDeep(entry, _.find(dataset, _.matchesProperty(primaryKeys, entry[datasetKey])));


      });
      flattened.push(entry);

    });


    return flattened;
  }


  make_data_include_all_keys(allData, origDat, p) {

    let includeOrigDataKeys = false;
    if (_.keys(p).includes('include_original_data_keys')) {
      includeOrigDataKeys = p['include_original_data_keys'];
    }

    if (includeOrigDataKeys) {
      allData['origData'] = origDat;
    }


    let allKeys = [];

    if (_.isArray(allData)) {
      allKeys = _.keys(allData[0]);
      // if (allData[0].length === 1){
      //   allData = allData[0];
      // }
    } else {
      _.forOwn(allData, (dat, key) => {
        // console.log("key: ", key);
        // console.log("dat: ", dat);
        // console.log("_.keys(dat[0])", _.keys(dat[0]));
        allKeys = _.concat(allKeys, _.keys(dat[0]));
      });
    }

    // console.log("allkeys: ", allKeys);

    if (includeOrigDataKeys) {
      if (_.isArray(origDat)) {
        allKeys = _.keys(origDat[0]);
      } else {
        _.forOwn(origDat, (dat, key) => {
          allKeys = _.concat(allKeys, _.keys(dat[0]));
        });
      }
    }


    let entrysKeys;
    let tempOutData;

    // for each dataset
    _.forOwn(allData, (entries, key) => {
      tempOutData = _.concat(tempOutData,
        // for each data entry in the dataset
        _.each(entries, (entry) => {
          entrysKeys = _.keys(entry);
          let keysToAdd = allKeys.filter(key => !entrysKeys.includes(key));
          _.each(keysToAdd, (thisKey) => {
            entry[thisKey] = "";
          });

          return entry;
        }));
    });

    if (tempOutData) {
      tempOutData.shift();
    }

    // console.log("tempOutData: ", tempOutData);
    return tempOutData;
  }

  delete_entry_by(inDat, idKey, idVal) {
    return _.each(inDat, (entry) => {
      if (entry[idKey] !== idVal) {
        return entry;
      }
    });
  }

  // // selects default to all
  // select_entries(inData, p) {
  //   let possibleEntries = inData;
  //   console.log("p: ", p);
  //   _.forOwn(p['search_keys'], (vals, key) => {
  //     if (!_.isArray(vals)) {
  //       vals = [vals];
  //     }
  //     _.each(vals, (val) => {
  //       val = val.toLowerCase();
  //       if (val.includes('*')) {
  //         val = val.replace('*', '');
  //         possibleEntries = _.filter(possibleEntries, (obj) => {
  //
  //           let objVal = obj[key].toLowerCase();
  //           return objVal.includes(val);
  //         });
  //       } else {
  //         possibleEntries = _.filter(possibleEntries, (obj) => {
  //           let objVal = obj[key].toLowerCase();
  //           return objVal === val;
  //         });
  //       }
  //
  //     });
  //   });
  //
  //   let keysToSelectP = _.keys(p['search_keys'])[0];
  //   this.su.print_blank_lines(2, " found entries ");
  //   //console.log(this.select_subset_of_keys_from_arr(possibleEntries));
  //
  //   return possibleEntries;
  // }

  update_entries(inDat, props) {
    let updatedEntries = this.select_entries(inDat, props['select_entries']);
    return updatedEntries;
  }


  sanitise(inDat) {
    // this breaks some stuff for some reason.

    return _.each(inDat, (entry) => {
      if (_.isPlainObject(entry)) {
        _.forOwn(inDat, (val, key) => {
          if (_.isArray(val) || _.isObject(val)) {
            this.sanitise(val);
          } else {
            // we have a leaf !
            if (_.isString(val)) {
              let newVal = val.replace(",", ";").replace(",", ";");
              entry[key] = newVal;
            }
          }
        });
        return entry;
      }
    });
  }

  add_id_to_objects(inDat, p, count) {
    let firstGo;
    if (!count || !_.isNumber(count)) {
      firstGo = true;
      count = p['start_count_from'];
      // console.log("p: ", p);
      // console.log("inDat: ", inDat);
      // throw new Error();
    }

    if (_.isArray(inDat)) {
      // each data entry, map its key as a name value and its children as an array of children
      let outEntries = [];
      _.each(inDat, (entry) => {
        [entry, count] = this.add_id_to_objects(entry, p, count);
        outEntries.push(entry);
      });
      inDat = _.clone(outEntries);
    } else if (_.isPlainObject(inDat)) {
      let objectMatches = true;
      let thisObjectsKeys = _.keys(inDat);
      if (p['matching_obj']) {
        objectMatches = this.om.check_obj_matches(inDat, p['matching_obj']);

      }

      // console.log("this object keys: ", thisObjectsKeys);
      if (objectMatches && !thisObjectsKeys.includes(p['new_key'])) {
        if (p['add_prefix']) {
          inDat[p['new_key']] = _.clone(p['add_prefix']);
        } else {
          inDat[p['new_key']] = "";
        }
        if (p['method_to_extract_new_value'].toLowerCase() === 'sequential_count') {
          count += 1;
          // console.log("count: ", count);
          inDat[p['new_key']] += _.clone(count);
        }
      }

      _.forOwn(inDat, (val, key) => {
        [inDat[key], count] = this.add_id_to_objects(val, p, count);

      });
    }

    if (firstGo) {
      // console.log('');
      // console.log("p: ", p);
      // console.log("inDat: ", inDat);
    }

    return [inDat, count];
  }

  add_new_object_for_object_property(inDat, p) {
    // console.log("add_new_object_for_object_property: ");
    let outObjs = [];
    let newKeyValFromChildP = p['new_parent_key_val_from_child'];

    _.each(inDat, (entry) => {

      let outEntry = _.clone(entry);
      let propertyArrToDeriveFrom = entry[p['obj_property_arr_to_derive_new_obj_from']];
      _.each(propertyArrToDeriveFrom, (objPropVals) => {
        let matchingObjs;
        let newObj = _.clone(entry);
        let newKeys;
        newObj[p['obj_property_arr_to_derive_new_obj_from']] = [objPropVals];

        if (p['map_objs']) {
          newObj = this.da.map_objects_to_str_or_existing_key(newObj, p['map_objs']);
        }
        // newObj[p['obj_property_arr_to_derive_new_obj_from']] = [objPropVals];
        // if (!this.da.obj_exists_in( inDat, newObj )){
        // console.log("newKeyValFromChildP: ", newKeyValFromChildP);
        if (newKeyValFromChildP) {
          if (!outEntry[newKeyValFromChildP['new_key']]) {
            outEntry[newKeyValFromChildP['new_key']] = [];
          }
          outEntry[newKeyValFromChildP['new_key']].push(newObj[newKeyValFromChildP['from_key']]);
          //
          // console.log('');
          // console.log("NEW ORIG")
          this.su.cl(outEntry);
        }
        if (p['check_if_not_duplicate']) {
          let duplicateMatchP = p['check_if_not_duplicate'];

          let pCheckHasKeys = {};
          pCheckHasKeys['func'] = "check_obj_has_either_of_these_keys";
          pCheckHasKeys['keys_to_contain'] = newKeyValFromChildP['from_key'];

          let keyValPair = {};
          keyValPair[newKeyValFromChildP['from_key']] = newObj[newKeyValFromChildP['from_key']];

          let pCheckMatchingKey = {};
          pCheckMatchingKey['func'] = "check_obj_contains_either_of_these_key_value_pairs";
          pCheckMatchingKey['key_value_pairs'] = [keyValPair];

          let params = [];
          params = [_.clone(pCheckHasKeys), _.clone(pCheckMatchingKey)];

          // console.log("params: ", params);
          // throw new Error();
          // console.log("key val pair: ", keyValPair);

          matchingObjs = this.om.find_matching_nested_objs(inDat, pCheckMatchingKey);
          // console.log("matchingObjs: ", matchingObjs.length);

          if (!matchingObjs || matchingObjs.length === 0) {
            outObjs.push(newObj);

            // this.su.cl(newObj);
          } else {
            // console.log("we have ourselves a duplicate!");
          }
        } else {

          outObjs.push(newObj);
          // this.su.cl(newObj);
        }
        // }
      });

      outObjs.push(outEntry);

    });
    return outObjs;
  }



  add_property_array_from_matching_data(inDat, origDat, p, newArr) {
    let firstStep;
    if (!newArr) {
      newArr = [];
      firstStep = true;
    } else {
      firstStep = false;
    }
    if (_.isArray(inDat)) {
      // each data entry, map its key as a name value and its children as an array of children
      let outEntries = [];
      _.each(inDat, (entry) => {
        [entry, newArr] = this.add_property_array_from_matching_data(entry, origDat, p, newArr);
        outEntries.push(entry);
      });
      inDat = _.clone(outEntries);
    } else if (_.isPlainObject(inDat)) {
      let objectMatches = true;
      let thisObjectsKeys = _.keys(inDat);
      if (p['matching_obj']) {
        objectMatches = this.om.check_obj_matches(inDat, p['matching_obj']);
      }
      // console.log("objectMatches: ", thisObjectsKeys);

      if (objectMatches) {

        // console.log("objectMatches: ", objectMatches);
        if (p['new_array_values_from']) {
          let arrayValsP = p['new_array_values_from'];
          let arrayValsObjMatchingP = arrayValsP['matching_obj'];
          let outArr;
          if (arrayValsObjMatchingP) {
            if (arrayValsObjMatchingP['func'] === "check_obj_key_val_matches_scrutinised_key_val") {
              outArr = _.filter(origDat, [arrayValsObjMatchingP['object_match_key'], inDat[arrayValsObjMatchingP['scrutinised_obj_key']]]);
            } else {
              outArr = this.om.find_matching_nested_objs(inDat, arrayValsObjMatchingP);
            }
          } else {
            outArr = origDat;
          }

          // console.log("arrayValsP: ", arrayValsP);
          if (arrayValsP['keys_to_get_val_from']) {
            let tempArr = [];
            _.each(outArr, (outObj) => {
              // console.log("outObj: ", outObj);

              let outVal = _.pick(outObj, arrayValsP['keys_to_get_val_from']);
              // console.log("outVal: ", outVal);

              tempArr = _.concat(tempArr, _.values(outVal));
            });
            outArr = tempArr;
          }
          inDat[p['new_key']] = outArr;
        }
      }
    }
    if (firstStep) {
      // console.log("newArr: ", inDat)
    }
    return [inDat, newArr];
  }



  add_property_object_for_matching_data(inDat, p, mutatingData) {
    if (mutatingData === undefined || mutatingData === null) {
      if (p['increment_this_number']) {
        let pIncrementThis = p['increment_this_number'];
        mutatingData = Number(pIncrementThis['starting_val']);
      } else {
        mutatingData = [];
      }
    } else {}

    if (_.isArray(inDat)) {

      let outEntries = [];
      _.each(inDat, (entry) => {
        [entry, mutatingData] = this.add_property_object_for_matching_data(entry, p, mutatingData);
        outEntries.push(entry);
      });
      inDat = _.clone(outEntries);

    } else if (_.isPlainObject(inDat)) {
      let objectMatches = true;

      if (p['matching_obj']) {
        objectMatches = this.om.check_obj_matches(inDat, p['matching_obj']);
      }

      if (objectMatches) {
        if (p['increment_this_number']) {
          let pIncrementThis = p['increment_this_number'];

          if (pIncrementThis['increment_by']) {
            mutatingData = Number(mutatingData) + Number(pIncrementThis['increment_by']);
          }

          p['string_val'] = pIncrementThis['matching_val'];
          p['replace_with_this'] = Number(mutatingData);
          console.log(mutatingData);

          // console.log("p['new_properties']: ", p['new_properties']);
          p['curr_new_properties'] = this.replace_matching_values(p['new_properties'], p);
          // console.log("p['curr_new_properties']: ", p['curr_new_properties']);

        } else {
          p['curr_new_properties'] = _.clone(p['new_properties']);
        }
        // console.log("inDat prior: ", inDat);
        inDat = _.merge(inDat, p['curr_new_properties']);
        // console.log("inDat P-O-S-T: ", inDat);

      } else {
        _.forOwn(inDat, (v, k) => {
          [inDat[k], mutatingData] = this.add_property_object_for_matching_data(v, p, mutatingData);
        });
      }
    }

    return [inDat, mutatingData];
  }



  add_property_from_matching_data(inDat, origDat, p, newArr) {
    let firstStep;
    if (!origDat) {
      origDat = inDat;
    }
    if (!newArr) {
      newArr = [];
      firstStep = true;
    } else {
      firstStep = false;
    }
    if (_.isArray(inDat)) {
      // each data entry, map its key as a name value and its children as an array of children
      let outEntries = [];
      _.each(inDat, (entry) => {
        [entry, newArr] = this.add_property_from_matching_data(entry, origDat, p, newArr);
        outEntries.push(entry);
      });
      inDat = _.clone(outEntries);
    } else if (_.isPlainObject(inDat)) {
      let objectMatches = true;
      let thisObjectsKeys = _.keys(inDat);
      if (p['matching_obj']) {
        objectMatches = this.om.check_obj_matches(inDat, p['matching_obj']);
      }
      // console.log("objectMatches: ", thisObjectsKeys);

      if (objectMatches) {
        if (p['new_val']) {
          let pNewVal = p['new_val'];
          switch (pNewVal['func']) {
            case 'boolean_if_matches':
              inDat[p['new_key']] = objectMatches;
              break;

            case 'replace_str':
              inDat[p['new_key']] = this.su.modify_str(inDat[pNewVal['from_key']], pNewVal['replace_str_params']);
              break;
          }
        } else {
          // console.log("objectMatches: ", objectMatches);
          if (p['new_array_values_from']) {
            let arrayValsP = p['new_array_values_from'];
            let arrayValsObjMatchingP = arrayValsP['matching_obj'];
            let outArr;
            if (arrayValsObjMatchingP['func'] === "check_obj_key_val_matches_scrutinised_key_val") {
              outArr = _.filter(origDat, [arrayValsObjMatchingP['object_match_key'], inDat[arrayValsObjMatchingP['scrutinised_obj_key']]]);
              // console.log("arrayValsObjMatchingP: ", arrayValsObjMatchingP);
              // console.log("outArr: ", outArr.length);

            } else {
              outArr = this.om.find_matching_nested_objs(inDat, arrayValsObjMatchingP);
            }

            // console.log("arrayValsP: ", arrayValsP);
            if (arrayValsP['keys_to_get_val_from']) {
              let tempArr = [];
              _.each(outArr, (outObj) => {
                let outVal = _.pick(outObj, arrayValsP['keys_to_get_val_from']);
                tempArr = _.concat(tempArr, _.values(outVal));
              });
              outArr = tempArr;
            }
            inDat[p['new_key']] = outArr;
          }
        }
      }
    }
    if (firstStep) {
      // console.log("newArr: ", inDat)
    }
    return [inDat, newArr];
  }



  replace_ids_with_objects(referenceDat, datToManip, p) {

    return _.each(datToManip, (entry) => {
      if (_.isPlainObject(entry)) {
        _.forOwn(entry, (val, key) => {
          if (_.isArray(val) || _.isPlainObject(val)) {
            entry[key] = this.replace_ids_with_objects(referenceDat, val, p);
          } else {
            // we have a leaf !
            if (_.isString(val)) {
              entry[key] = _.find(referenceDat, [p['reference_id_key'], val]);
              if (!entry[key]) {
                entry[key] = val;
              } else {
                if (p['keys_to_select']) {
                  entry[key] = _.pick(entry[key], p['keys_to_select']);
                }
              }
            }
          }
        });
      }
      return entry;

    });
  }


  swop_matching_str_vals_for_all_arrays_and_objs(inDat, valsToSwop, mergedValsToSwop, strsToMatch) {
    let outData;
    if (!mergedValsToSwop) {
      console.log(valsToSwop);
      // console.log();
      _.each(valsToSwop, (valPair) => {
        mergedValsToSwop = _.merge(mergedValsToSwop, valPair);
      })
      strsToMatch = _.keys(mergedValsToSwop);
      console.log("keys: ", strsToMatch);
    }

    if (_.isArray(inDat)) {
      outData = [];

      _.each(inDat, (entry) => {
        // console.log("entry: ", typeof(entry));

        let outEntry = this.swop_matching_str_vals_for_all_arrays_and_objs(entry, valsToSwop, mergedValsToSwop, strsToMatch);
        if (strsToMatch.includes(outEntry)) {
          console.log("replacing ", outEntry, " with ", mergedValsToSwop[outEntry]);
          outEntry = mergedValsToSwop[outEntry];
        } else {
          // console.log(" outEntry ", outEntry , " not in ", strsToMatch);

        }
        // don't allow duplicates
        if (!outData.includes(outEntry)) {
          outData.push(outEntry);
        }

      });
    } else if (_.isPlainObject(inDat)) {
      outData = _.clone(inDat);

      _.forOwn(outData, (val, key) => {
        if (_.isArray(val) || _.isPlainObject(val)) {
          // console.log("arr obj: ", val);
          outData[key] = this.swop_matching_str_vals_for_all_arrays_and_objs(val, valsToSwop, mergedValsToSwop, strsToMatch);
        } else if (_.isString(val)) {
          if (strsToMatch.includes(val)) {
            console.log("plain obj replacing ", val, " with ", mergedValsToSwop[val]);
            outData[key] = mergedValsToSwop[val];
          }
        }
      });

    } else if (_.isString(inDat)) {
      if (strsToMatch.includes(inDat)) {
        console.log("replacing ", inDat, " with ", mergedValsToSwop[inDat]);
        outData = mergedValsToSwop[inDat];

      } else {
        outData = _.clone(inDat);
      }
    } else {
      outData = _.clone(inDat);
    }
    if (outData) {
      // console.log("outData ", outData);
      return outData;
    }
  }

  remove_all_ref_to_matching_str(inDat, matchingStrings) {
    let outData;

    if (_.isString(matchingStrings)) {
      matchingStrings = [matchingStrings];
    }

    if (_.isArray(inDat)) {
      outData = [];

      _.each(inDat, (entry) => {
        // console.log("entry: ", typeof(entry));

        let outEntry = this.remove_all_ref_to_matching_str(entry, matchingStrings);
        if (!matchingStrings.includes(outEntry)) {
          outData.push(outEntry);
        } else {
          console.log("removing ", outEntry);
        }

      });
    } else if (_.isPlainObject(inDat)) {
      outData = _.clone(inDat);

      _.forOwn(outData, (val, key) => {
        if (_.isArray(val) || _.isPlainObject(val)) {
          outData[key] = this.remove_all_ref_to_matching_str(val, matchingStrings);
        }
      });

    } else if (_.isString(inDat)) {
      if (!matchingStrings.includes(inDat)) {
        outData = _.clone(inDat);
      } else {
        // console.log("removing ", inDat);
      }
    } else {
      outData = _.clone(inDat);
    }
    if (outData) {
      return outData;
    }
  }


  replace_matching_keys_value_with(referenceDat, inDat, p) {
    if (!referenceDat) {
      referenceDat = _.clone(inDat);
      console.log("indat!: ", inDat.length);
    }
    let outData;

    if (_.isArray(inDat)) {
      outData = [];

      _.each(inDat, (entry) => {
        // console.log("entry: ", typeof(entry));

        let outEntry = this.replace_matching_keys_value_with(referenceDat, entry, p);
        outData.push(outEntry);

      });
    } else if (_.isPlainObject(inDat)) {
      let outEntry = this.da.map_objects_to_str_or_existing_key(inDat, p['new_key_val_pairs'], p['onlyIfKeyFound']);
      outData = _.clone(outEntry);

      _.forOwn(outData, (val, key) => {
        _.each(p['matching_keys'], (matchingKey) => {
          let keyMatches = false;
          if (_.isArray(val) || _.isPlainObject(val)) {
            outData[key] = this.replace_matching_keys_value_with(referenceDat, val, p);
          }
          if (key === matchingKey) {
            // handle duplicate deletion
            if (_.keys(p).includes('remove_duplicate_key_val_pairs')) {
              let matchingVals = _.clone(p['remove_duplicate_key_val_pairs']);
              let arrOfVals = this.da.make_arr_if_not(val);
              _.each(arrOfVals, (v) => {
                if (!_.keys(matchingVals).includes(matchingKey)) {
                  matchingVals[matchingKey] = this.da.make_arr_if_not(v);
                  // console.log("p['remove_duplicate_key_val_pairs']: ", p['remove_duplicate_key_val_pairs']);
                } else if (!matchingVals[matchingKey].includes(v)) {
                  // console.log("val: ", v);
                  if (_.isArray(v)) {
                    matchingVals[matchingKey] = _.concat(_.flattenDeep(matchingVals[matchingKey]), _.flattenDeep(val));
                  } else {
                    matchingVals[matchingKey].push(v);
                  }
                  // console.log("matchingVals post: ", matchingVals[matchingKey]);
                } else {
                  // key v matches one already seen
                  // console.log("deleting: ", key, " v: ", outData[key]);
                  delete outData[key];
                  // console.log("done deleting.");
                }
                p['remove_duplicate_key_val_pairs'] = _.clone(matchingVals);
              });
            }

            if (p['new_val_from_reference_dat']) {
              outData[key] = referenceDat;
            }
          }
        });

      });

    } else {
      outData = _.clone(inDat);
    }
    return outData;
  }



  replace_matching_keys_value_with(referenceDat, inDat, p) {
    if (!referenceDat) {
      referenceDat = _.clone(inDat);
      console.log("indat!: ", inDat.length);
    }
    let outData;

    if (_.isArray(inDat)) {
      outData = [];

      _.each(inDat, (entry) => {
        // console.log("entry: ", typeof(entry));

        let outEntry = this.replace_matching_keys_value_with(referenceDat, entry, p);
        outData.push(outEntry);

      });
    } else if (_.isPlainObject(inDat)) {
      let outEntry = this.da.map_objects_to_str_or_existing_key(inDat, p['new_key_val_pairs'], p['onlyIfKeyFound']);
      outData = _.clone(outEntry);

      _.forOwn(outData, (val, key) => {
        _.each(p['matching_keys'], (matchingKey) => {
          let keyMatches = false;
          if (_.isArray(val) || _.isPlainObject(val)) {
            outData[key] = this.replace_matching_keys_value_with(referenceDat, val, p);
          }
          if (key === matchingKey) {
            // handle duplicate deletion
            if (_.keys(p).includes('remove_duplicate_key_val_pairs')) {
              let matchingVals = _.clone(p['remove_duplicate_key_val_pairs']);
              let arrOfVals = this.da.make_arr_if_not(val);
              _.each(arrOfVals, (v) => {
                if (!_.keys(matchingVals).includes(matchingKey)) {
                  matchingVals[matchingKey] = this.da.make_arr_if_not(v);
                  // console.log("p['remove_duplicate_key_val_pairs']: ", p['remove_duplicate_key_val_pairs']);
                } else if (!matchingVals[matchingKey].includes(v)) {
                  // console.log("val: ", v);
                  if (_.isArray(v)) {
                    matchingVals[matchingKey] = _.concat(_.flattenDeep(matchingVals[matchingKey]), _.flattenDeep(val));
                  } else {
                    matchingVals[matchingKey].push(v);
                  }
                  // console.log("matchingVals post: ", matchingVals[matchingKey]);
                } else {
                  // key v matches one already seen
                  // console.log("deleting: ", key, " v: ", outData[key]);
                  delete outData[key];
                  // console.log("done deleting.");
                }
                p['remove_duplicate_key_val_pairs'] = _.clone(matchingVals);
              });
            }

            if (p['new_val_from_reference_dat']) {
              outData[key] = referenceDat;
            }
          }
        });

      });

    } else {
      outData = _.clone(inDat);
    }
    return outData;
  }


  swap_a_string_val_for_a_matching_str_val(datToManip, p) {
    return _.each(datToManip, (entry) => {
      if (_.isPlainObject(entry)) {
        _.forOwn(entry, (val, key) => {
          if (_.isArray(val) || _.isPlainObject(val)) {
            entry[key] = this.replace_ids_with_objects(datToManip, val, p);
          } else {
            if (p['matching_key'] === key && p['matching_val'] === val) {
              entry[key] = p['new_value']
            }
          }
        });
      }
      return entry;

    });
  }

  map_property_from_reference_property(referenceDat, inDat, p) {

    if (!referenceDat) {
      referenceDat = _.clone(inDat);
    }

    return _.each(inDat, (entry) => {
      // console.log("ZZ: ", entry);
      if (_.isPlainObject(entry)) {
        // let refEntry = _.find(referenceDat, [p['reference_id_key'], entry[p['mapping_id_key']]]);
        let newRefDat = [];
        // _.each(referenceDat, (refEntry) => {

        let wasFound = false;
        _.each(p['mapping_id_keys'], (mKey) => {

          entry[mKey] = this.da.make_arr_if_not(entry[mKey]);

          let outVal = [];
          _.each(entry[mKey], (valToMatch) => {
            let refEntry = _.find(referenceDat, [p['reference_id_key'], valToMatch]);
            // console.log("valToMatch: ", valToMatch);
            if (refEntry) {
              outVal.push(refEntry[p['reference_property_key']]);
            }
          });
          // whether to make array or not
          if (p['output_as_arr']) {
            if (outVal.length === 0) {
              entry[mKey] = [];
            } else {
              entry[mKey] = outVal;
            }
          } else {
            if (outVal.length === 1) {
              entry[mKey] = outVal[0];
            } else if (outVal.length === 0) {
              entry[mKey] = "";
            } else {
              entry[mKey] = outVal;
            }
          }

        });
      }
      return entry;

    });
  }



  map_property_from_reference_property_2(referenceDat, inDat, p) {
    // console.log("p: ", p);
    if (!_.keys(p).includes('firstGo')){
      p['firstGo']="yes";
      console.log('');
      console.log("refDat");
      this.da.print_keys(referenceDat);
      console.log('');
      console.log("in dat")
      this.da.print_keys(inDat);

    } else {
      p['firstGo']="no";
    }

    if (!referenceDat) {
      referenceDat = _.clone(inDat);
    }

    let outObj;


    if (_.isArray(inDat)) {
      outObj = [];

      // each data entry, map its key as a name value and its children as an array of children
      _.each(inDat, (entry) => {
        let outEntry = _.clone(entry);

        outEntry = this.map_property_from_reference_property_2(referenceDat, entry, p);
        outObj.push(outEntry);
      });

    } else if (_.isObject(inDat)) {
      // console.log(inDat);
      outObj = _.clone(inDat);

      _.forOwn(inDat, (val, key) => {
        // if (_.isArray(val) || _.isPlainObject(val)) {
          outObj[key] = this.map_property_from_reference_property_2(referenceDat, val, p);
        // }
      });
    } else if (_.isString(inDat)) {

      let matchingEntry = _.find(referenceDat, [p['reference_id_key'], inDat]);

      if (matchingEntry && matchingEntry[p['reference_property_key']]) {
        // console.log(inDat, " matching : ", matchingEntry[p['reference_id_key']]);

        outObj = matchingEntry[p['reference_property_key']];
      } else {
        outObj = inDat;
      }

    } else {
      outObj = inDat;
    }



    return outObj;
  }




  merge_duplicates(inDat, p, namesToSkip, origDat) {
    if (!namesToSkip) {
      namesToSkip = [];
    } else {
      // console.log("namesToSkip: ", namesToSkip);
    }
    if (!origDat) {
      origDat = _.clone(inDat);
    }
    let outDat;

    if (_.isArray(inDat)) {
      // console.log("***  []")

      if (!outDat) {
        outDat = [];
      }
      _.each(inDat, (entry) => {
        let [outEntry, newNamesToSkip] = this.merge_duplicates(entry, p, namesToSkip, origDat);
        if (outEntry) {
          // check if outEntry is a scrutinized item
          let isObjectOfScrutiny = false;
          if (outEntry) {
            isObjectOfScrutiny = this.om.check_obj_matches(outEntry, p['object_to_scrutinize']);
          }
          if (isObjectOfScrutiny) {
            if (!namesToSkip.includes(outEntry[p['match_by_key']])) {
              outDat.push(outEntry);
              namesToSkip.push(outEntry[p['match_by_key']]);
              // console.log("pushing ", outEntry);
            } else {
              // console.log("namesToSkip ", namesToSkip)
              // console.log("not pushing ", outEntry);
            }
          } else {
            // console.log("pushing ", outEntry);
            outDat.push(outEntry);
          }

        }
      });
    } else if (_.isPlainObject(inDat)) {
      // console.log("***  OBJ ", inDat);
      outDat = _.clone(inDat);

      if (inDat[p['match_by_key']] && !namesToSkip.includes(inDat[p['match_by_key']])) {

        let matchingObjs = _.clone(origDat);
        let i = 0;
        _.each(p['matching_objs'], (matchingObjP) => {
          i++;
          let tempP = _.clone(matchingObjP);
          // console.log("matching obj p: ", matchingObjP);
          if (matchingObjP['func'] === "check_obj_contains_these_key_value_pairs") {
            let keyValPair = {};
            if (!matchingObjP['key_value_pairs']) {
              // console.log(" inDat[matchingObjP['match_by_key']];: ",  inDat[matchingObjP['match_by_key']]);
              keyValPair[matchingObjP['match_by_key']] = inDat[matchingObjP['match_by_key']];
            } else {
              keyValPair = _.clone(matchingObjP['key_value_pairs']);
            }
            tempP['key_value_pairs'] = _.clone(keyValPair);
          }
          if (matchingObjP['func'] === "check_obj_does_not_match_exactly") {
            tempP['obj_to_match_with'] = _.clone(inDat);
          }

          matchingObjs = _.clone(this.om.find_matching_nested_objs(matchingObjs, tempP));

          matchingObjs = this.da.delete_obj_from_array(matchingObjs, inDat, p['keys_to_match_for_self_removal'])

          // console.log("matching obj! ", i, " ", matchingObjs);

        });
        if (matchingObjs && (matchingObjs.length > 0 || _.isPlainObject(matchingObjs))) {
          // let matchingObj = matchingObjs[0];
          if (!_.isArray(matchingObjs)) {
            matchingObjs = [matchingObjs];
          }
          _.each(matchingObjs, (matchingObj) => {
            _.each(p['override_these_keys'], (keyToOverride) => {
              matchingObj[keyToOverride] = inDat[keyToOverride];
            });

            outDat = _.clone(this.da.merge_internal_arrays_of_equivalent_data_hierarchy(_.clone(inDat), matchingObj));
          });
          console.log("outDat POST merge: ", outDat);

        }
      } else if (!inDat[p['match_by_key']]) {
        if (!outDat) {
          outDat = _.clone(inDat);
          console.log("should be returning: ", outDat);

        }
        _.forOwn(outDat, (val, key) => {
          if (_.isArray(val) || _.isPlainObject(val)) {
            [outDat[key], namesToSkip] = _.clone(this.merge_duplicates(val, p, namesToSkip, origDat));
          }
        });
      }

    }
    // console.log("outData: ", outDat);

    return [outDat, namesToSkip];
  }


  merge_two_datasets(refDat, inDat, p, namesToSkip, idsToSwop) {
    let firstGo = false;
    let newRefDat;
    if (!namesToSkip) {
      firstGo = true;
      namesToSkip = [];
      idsToSwop = [];
    }
    if (!refDat) {
      refDat = _.clone(inDat);
    }
    // console.log("inDat: ", inDat);
    // console.log('');console.log('');console.log('');console.log('');
    // console.log("refDat: ", refDat);
    // throw new Error();
    let outDat;

    if (_.isArray(inDat)) {
      // console.log("***  []")

      if (!outDat) {
        outDat = [];
      }
      _.each(inDat, (entry) => {
        let [outEntry, []] = this.merge_two_datasets(refDat, entry, p, namesToSkip, idsToSwop);
        if (outEntry) {
          // check if outEntry is a scrutinized item
          let isObjectOfScrutiny = false;
          if (outEntry) {
            isObjectOfScrutiny = this.om.check_obj_matches(outEntry, p['object_to_scrutinize'], namesToSkip, idsToSwop);
          }
          if (isObjectOfScrutiny) {
            // console.log("")
            let tempNamesToSkip = _.clone(namesToSkip);
            tempNamesToSkip.pop();
            if (!tempNamesToSkip || !tempNamesToSkip.includes(outEntry[p['match_by_key']])) {
              outDat.push(outEntry);
              // console.log("pushing ", outEntry);
            } else {
              // console.log("namesToSkip ", tempNamesToSkip)
              // console.log("not pushing ", outEntry);
            }
          } else {
            outDat.push(outEntry);
          }
        }
      });
    } else if (_.isPlainObject(inDat)) {
      // console.log("***  OBJ ", inDat);
      outDat = _.clone(inDat);

      if (inDat[p['match_by_key']] && !namesToSkip.includes(inDat[p['match_by_key']])) {

        let matchingObjs = _.clone(refDat);
        let i = 0;
        let pObjectsToMerge = p['objects_to_merge'];
        _.each(pObjectsToMerge['matching_objs'], (matchingObjP) => {
          i++;
          let tempP = _.clone(matchingObjP);
          // console.log("matching obj p: ", matchingObjP);
          if (matchingObjP['func'] === "check_obj_contains_either_of_these_key_value_pairs") {
            let keyValPair = {};
            if (!matchingObjP['key_value_pairs']) {
              keyValPair[matchingObjP['match_by_key']] = inDat[matchingObjP['match_by_key']];
            } else {
              keyValPair = _.clone(matchingObjP['key_value_pairs']);
            }
            tempP['key_value_pairs'] = _.clone(keyValPair);
            // console.log("inDat: ", inDat);
            // console.log("tempP['key_value_pairs'] ", tempP['key_value_pairs']);
          }

          matchingObjs = _.clone(this.om.find_matching_nested_objs(matchingObjs, tempP));
          if (matchingObjs.length > 0) {
            console.log("matchingObjs before delete: ", matchingObjs);
          }
          matchingObjs = this.da.delete_obj_from_array(matchingObjs, inDat, p['keys_to_match_for_self_removal'])
          if (matchingObjs.length > 0) {
            console.log("matchingObjs after delete: ", matchingObjs.length);
          }
        });

        if (matchingObjs && (matchingObjs.length > 0 || _.isPlainObject(matchingObjs))) {
          console.log("inside merge: ", matchingObjs.length);
          // let matchingObj = matchingObjs[0];
          if (!_.isArray(matchingObjs)) {
            matchingObjs = [matchingObjs];
          }
          _.each(matchingObjs, (matchingObj) => {
            _.each(p['override_these_keys'], (keyToOverride) => {
              let idMatch = {};
              idMatch[matchingObj[p['id_key']]] = inDat[p['id_key']];
              idsToSwop.push(idMatch);

              matchingObj[keyToOverride] = inDat[keyToOverride];
            });
            console.log("outDat _PRE_ merge: ", outDat);
            console.log("outDat matchin obj: ", matchingObj);

            outDat = _.clone(this.da.merge_internal_arrays_of_equivalent_data_hierarchy(_.clone(inDat), matchingObj));
            console.log("outDat POST merge: ", outDat);

          });
          namesToSkip.push(outDat[p['match_by_key']]);
        }
      } else if (!inDat[p['match_by_key']]) {
        if (!outDat) {
          outDat = _.clone(inDat);
          // console.log("should be returning: ", outDat);

        }
        _.forOwn(outDat, (val, key) => {
          if (_.isArray(val) || _.isPlainObject(val)) {
            console.log("recursive step.");
            [outDat[key], namesToSkip] = _.clone(this.merge_two_datasets(refDat, val, p, namesToSkip, idsToSwop));
          }
        });
      }

    }
    // console.log("outData: ", outDat);
    if (firstGo) {
      if (p['save_ref_dat']) {
        console.log("saving ref dat: ");

        newRefDat = _.clone(refDat);
        let saveP = p['save_ref_dat'];
        if (saveP['delete_matching_objs']) {
          let delP = saveP['delete_matching_objs'];
          let matchP = delP['matching_obj'];
          console.log("namesToSkip: ", namesToSkip);

          let keyValPairs = this.da.create_key_val_pairs_from_arr_of_vals(matchP['match_by_key'], namesToSkip);

          matchP['key_value_pairs'] = _.clone(keyValPairs);
          console.log("matchP: ", matchP);

          newRefDat = this.swop_matching_str_vals_for_all_arrays_and_objs(newRefDat, idsToSwop);
          console.log("refDatPrior: ", newRefDat.length);
          newRefDat = this.delete_matching_objs(newRefDat, matchP);
          console.log("refDatPost: ", newRefDat.length);
        }
      }
      if (p['swap_ref_ids_of_merged_objs']) {
        console.log("p['swap_ref_ids_of_merged_objs']: ", p['swap_ref_ids_of_merged_objs']);
        console.log("outDat PRIOR:");
        console.log(outDat);
        outDat = this.swop_matching_str_vals_for_all_arrays_and_objs(outDat, idsToSwop);
        console.log("outDat POST:");
        //
        // console.log(outDat);
      }
    }


    return [outDat, namesToSkip, newRefDat];
  }


  delete_matching_objs(inDat, p) {
    let outDat;

    if (_.isArray(inDat)) {
      // console.log("***  []")

      outDat = [];
      _.each(inDat, (entry) => {
        let outEntry = this.delete_matching_objs(entry, p);
        if (outEntry) {
          // check if outEntry is a scrutinized item
          let isObjectToDel = false;
          isObjectToDel = this.om.check_obj_matches(outEntry, p);
          if (!isObjectToDel) {
            outDat.push(outEntry);
            // console.log("keeping: ", outEntry['name']);
          } else {
            // console.log("deleting: ", outEntry['name']);

          }

        }
      });
    } else if (_.isPlainObject(inDat)) {
      // console.log("***  OBJ ", inDat);
      outDat = _.clone(inDat);

      _.forOwn(outDat, (val, key) => {
        if (_.isArray(val) || _.isPlainObject(val)) {
          outDat[key] = _.clone(this.delete_matching_objs(val, p));
        }
      });
    } else {
      outDat = _.clone(inDat);
    }

    return outDat;
  }

  update_matching_object(arrOfObjs, matchByParams, newKey, newVal) {

    return _.each(arrOfObjs, (entry) => {
      if (_.isPlainObject(entry)) {
        if (this.om.check_obj_matches(entry, matchByParams)) {
          entry[newKey] = newVal;
          console.log("-!- ", newKey, " ", newVal);
        } else {
          console.log("Entry");
        }
        _.forOwn(entry, (val, key) => {

          if (_.isArray(val) || _.isPlainObject(val)) {
            entry[key] = this.update_matching_object(arrOfObjs, matchByParams, newKey, newVal);
          }
        });
      } else if (_.isArray(entry)) {
        entry = this.update_matching_object(arrOfObjs, matchByParams, newKey, newVal);

      }
      return entry;

    });
  }

}
