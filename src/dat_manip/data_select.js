// Functions used to extract / select / subset datasets


import StrUtils from './string_utils.js';
import TreeUtils from './tree_utils.js';
import DictArrUtils from "./dict_array_utils.js";
import ObjMatching from "./object_matching.js";
import 'lodash';
// const _ = require('lodash');

export default class DataSelect {
  constructor() {
    this.da = new DictArrUtils();
    this.om = new ObjMatching();
    this.su = new StrUtils();
  }

  get_uniques(data, p) {
    let uniqueEntries;
    // "Get unique identifier (starts with *)"

    let uniqueKeys = [];
    let uniqueKeyVal = [];
    _.forOwn(p, function(val, key) {
      let newKeyVal = {};
      if (val.includes('*')) {
        val = val.replace('*', '');
        p[key] = val;
        uniqueKeys.push(val);
      }
    });

    // Remove '*' unique key identifier
    _.forEach(uniqueKeys, function(el, i, arr) {
      arr[i] = el.replace("*", "");
      p[arr[i]] = p[el];
      delete p[el];
    });

    // Get unique entries
    _.forEach(uniqueKeys, function(uniqueKey, i, arr) {
      uniqueEntries = _.uniqBy(data, uniqueKey);
    });

    return [uniqueEntries, p, uniqueKeys];
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


  select_subset_of_keys_from_arr(data, p, keysToSelect, onlyVals, asSingleArray, firstGo, onlyUniques, newKey) {
    if (firstGo === undefined) {
      firstGo = true;
    } else {
      firstGo = false;
    }

    if (p['keys_to_select']) {
      keysToSelect = p['keys_to_select'];
    }
    if (p['only_vals']) {
      onlyVals = p['only_vals'];
    }
    if (p['as_single_array']) {
      asSingleArray = p['as_single_array'];
    }
    if (p['only_uniques']) {
      onlyUniques = p['only_uniques'];
    }
    if (p['new_key']) {
      newKey = p['new_key'];
    }

    let outEntries = [];

    data = this.da.make_arr_if_not(data);

    _.each(data, (entry) => {
      if (keysToSelect) {
        let pickedKeys = _.pick(entry, keysToSelect);
        if (onlyVals) {
          pickedKeys = _.values(pickedKeys);
        }
        entry = _.clone(pickedKeys);
        // console.log("entry: ", entry);
      } else {
        if (onlyVals) {
          entry = _.values(entry);
          console.log("entry: ", entry);
        }
      }
      if (asSingleArray) {
        outEntries = _.concat(outEntries, entry);
      } else {
        // console.log(entry[0]);
        outEntries.push(entry);
      }
    });

    if (firstGo) {
      // console.log("outEntries: ", outEntries);

      if (p['flatten_array']) {
        outEntries = _.flattenDeep(outEntries);
      }
      if (keysToSelect){
        outEntries = _.sortBy(outEntries, keysToSelect);
      }
      if (onlyUniques){
        outEntries = _.uniq(outEntries);
      }
      if (newKey){
        let tempEntries = [];
        _.each(outEntries, (outEntry) => {
          let currObj = {};
          currObj[newKey] = outEntry;
          tempEntries.push(currObj);
        });
        outEntries = tempEntries;
      }
    }
    return outEntries;

  }



  select_subset_of_vals_from_arr(data, p, keysToSelect, onlyVals, asSingleArray, firstGo, onlyUniques) {
    if (firstGo === undefined) {
      firstGo = true;
    } else {
      firstGo = false;
    }

    if (p['keys_to_select']) {
      keysToSelect = p['keys_to_select'];
    }
    if (p['only_vals']) {
      onlyVals = p['only_vals'];
    }
    if (p['as_single_array']) {
      asSingleArray = p['as_single_array'];
    }
    if (p['only_uniques']) {
      onlyUniques = p['only_uniques'];
    }

    let outEntries = [];

    _.each(data, (entry) => {
      if (keysToSelect) {
        let pickedKeys = _.pick(entry, keysToSelect);
        if (onlyVals) {
          pickedKeys = _.values(pickedKeys);
        }
        entry = _.clone(pickedKeys);
        // console.log("entry: ", entry);
      } else {
        if (onlyVals) {
          entry = _.values(entry);
        }
      }
      if (asSingleArray) {
        outEntries = _.concat(outEntries, entry);
      } else {
        // console.log(entry[0]);
        outEntries.push(entry);
      }


    });

    if (firstGo) {
      // console.log("outEntries: ", outEntries);

      if (p['flatten_array']) {
        outEntries = _.flattenDeep(outEntries);
      }
      if (keysToSelect){
        outEntries = _.sortBy(outEntries, keysToSelect);
      }
      if (onlyUniques){
        outEntries = _.uniq(outEntries);
      }
    }
    return outEntries;

  }




  select_matching( inDat, p ) {

    let outDat;

    if (_.isArray(inDat)) {
      // console.log("***  []")

      outDat = [];

      _.each(inDat, (entry) => {
        let outEntry = this.select_matching(entry, p);
        if (outEntry) {
          // check if outEntry is a scrutinized item

          outDat.push(outEntry);
        }

      });
    } else if (_.isPlainObject(inDat)) {

      outDat = null;

      let objUpForScrutiny = true;
      if (p['scrutinised_obj']) {
        let pScrutinisedObj = p['scrutinised_obj'];
        objUpForScrutiny = this.om.check_obj_matches(inDat, pScrutinisedObj['matching_obj']);
      }

      let objMatches = true
      if (objUpForScrutiny) {
        if (p['matching_obj']) {
          // console.log("p: ", JSON.stringify(p['matching_obj']));
          objMatches = this.om.check_obj_matches(inDat, p['matching_obj']);
        }
      }

      if (objMatches) {
        outDat = _.clone(inDat);
        _.forOwn(outDat, (val, key) => {
          if (_.isArray(val) || _.isPlainObject(val)) {
            outDat[key] = _.clone(this.select_matching(val, p));
          }
        });
      } else {
        // console.log(inDat, "inDat: does not match!! ");

        return false;
      }
    } else {
      outDat = _.clone(inDat);
    }

    if (outDat) {
      return outDat;
    }
  }


  find_diff_between_two_objs( inDat, refDat, p) {

    let outDat;
    let objAlreadyExists = true;
    let firstGo = false;
    if (!p){
      firstGo = true;
      p = {};
    }

    if (_.isArray(inDat)) {

      _.each( inDat, (entry) => {
        let outEntry;

        if ( _.isPlainObject(entry) ){
          // console.log("objAlreadyExists obj: ", objAlreadyExists);
          outEntry = this.find_diff_between_two_objs(refDat, entry, p );
        }
        if ( outEntry ) {
          console.log("pushing ", outEntry);
          if (!outDat){
            outDat = [];
          }
          outDat.push( outEntry );
        }

      });
    } else if (_.isPlainObject( inDat )) {
      outDat = {};
      _.forOwn(inDat, (v, k) => {
        if (_.isPlainObject(v) || _.isArray(v)){
          outDat[k] = this.find_diff_between_two_objs(v, refDat, p);
        } else {
          let keyValPairExists = false;

          let keyValPair = {};
          keyValPair[k] = v;
          keyValPairExists = this.om.key_val_pair_exists_in(refDat, keyValPair);

          if (!keyValPairExists){
            console.log("keyValPair ", keyValPair, " does not exist");
            console.log('');
            outDat[k] = v;
            // console.log("winner! ", outDat);
          } else {
            console.log("keyValPair ", keyValPair, " exists");
          }

        }
      });
    }
    if (firstGo){
      console.log(outDat);
    }
    if (outDat) {
      return outDat;
    }
  }


  extract_uniques_and_map(data, p, deleteUnspecifiedKeys) {

    if (deleteUnspecifiedKeys === undefined) {
      if (_.keys(p).includes('deleteUnspecifiedKeys')) {
        deleteUnspecifiedKeys = p['deleteUnspecifiedKeys'];
        delete p['deleteUnspecifiedKeys'];
      } else {
        deleteUnspecifiedKeys = true;
      }
    }

    let [uniqueEntries, cleanedp, uniqueKeys] = this.get_uniques(data, p);

    // console.log("uniqueEntries: ", uniqueEntries.length );


    let newOutData = this.map_keys_to_keys(uniqueEntries, cleanedp, deleteUnspecifiedKeys);
    console.log("unique and mapped: ", newOutData.length);
    this.dictArrUtils.print_keys(newOutData, "");

    return [newOutData, uniqueKeys];
  }

  extract_uniques_from_keys(data, p) {

    let uniqueKeys = this.da.make_arr_if_not(p["from_keys"]);

    let allItems = [];

    // Get unique entries
    // console.log("data: ", data);



    _.each(uniqueKeys, (uniqueKey) => {
      // _.map(dat, _.iteratee(key)) returns only the values in dat from key
      allItems = _.concat(allItems, _.flattenDeep(_.map(data, _.iteratee(uniqueKey))));
    });


    // _.compact removes ''
    let referencedItems = _.compact(_.uniq(allItems));

    let alreadyEntered = _.compact(_.uniq(_.map(data, _.iteratee(p["comparator_key"]))));

    let needToBeEntered = _.pullAll(referencedItems, alreadyEntered);

    let outData = [];
    if (p['add_to_current_dataset']) {
      outData = data;
    }
    _.each(needToBeEntered, (entry) => {
      let outObj = {};
      let outKey;
      if (p['new_key']){
        outKey = p['new_key'];
      } else {
        outKey = p['from_keys'][0];
      }
      outObj[outKey] = entry;
      outData.push(outObj);
    });
    this.da.print_keys(outData, "");
    // console.log("outData: ", outData);

    return outData;
  }


  extract_nested_objects_into_array(inDat, refDat, p, outArray) {
    let firstGo = false;
    // console.log("indAT: ", inDat);
    // console.log("refDat", refDat);

    // if (p['use_newDat_as_property']){
    //   console.log(p);
    // }

    if (!outArray) {
      outArray = [];
      firstGo = true;
    }
    let returnedArr;
    if (_.isArray(inDat)) {
      // each data entry, map its key as a name value and its children as an array of children
      _.each(inDat, (entry) => {
        returnedArr = this.extract_nested_objects_into_array(entry, inDat, p, outArray);
      });
    } else if (_.isPlainObject(inDat)) {
      let objectMatches = true;

      if (p['matching_obj']) {
        // console.log("inDat: ", inDat);
        objectMatches = this.om.check_obj_matches(inDat, p['matching_obj']);
      }
      if (objectMatches) {
        // console.log("inDat: ", inDat['name'].substring(0,70), " ^^ ", inDat['id'].substring(0,40));
        // inDat =
        if (p['return_only_this_keys_vals']) {
          outArray.push(inDat[p['return_only_this_keys_vals']]);

        } else {
          outArray.push(inDat);
        }
      } else {
        _.forOwn(inDat, (val, key) => {
          returnedArr = this.extract_nested_objects_into_array(val, inDat, p, outArray);
        });
      }
    }
    // if (returnedArr){
    //   outArray = _.concat(outArray, returnedArr);
    // }
    if (firstGo) {
      if (p['only_return_unique']) {
        outArray = _.uniq(outArray);
      }
      if (p['flatten_array']) {
        outArray = _.flattenDeep(outArray);
      }
    }
    return outArray;
  }


  extract_categories_into_files(inDat, refDat, p, outArray) {
    let firstGo = false;
    // console.log("indAT: ", inDat);
    // console.log("refDat", refDat);
    // throw new Error();

    // if (p['use_newDat_as_property']){
    //   console.log(p);
    // }
    let filenamePrefix = "";
    if (p['filename_prefix']){
      filenamePrefix = p['filename_prefix'];
    }

    let outDataSets = [];
    console.log(refDat);
    let pMatchObj = {};
    if (!p['matching_obj']){
      pMatchObj['func'] = "check_obj_contains_these_key_value_pairs";
    } else {
      pMatchObj = p['matching_obj'];
    }

    _.each(refDat, (cat) => {
      let outArray = [];
      if (!p['matching_obj']){
        let keyValP = {};
        keyValP[p['from_key']] = cat.toString();
        pMatchObj['key_value_pairs'] = keyValP;
      }
      //
      _.each(inDat, (entry) => {
        let objectMatches = true;

        if (pMatchObj) {
          // console.log(pMatchObj);
          // console.log("cat: ", cat);
          // console.log("inDat: ", inDat);
          objectMatches = this.om.check_obj_matches(entry, pMatchObj);
        }
        if (objectMatches) {

          if (p['return_only_this_keys_vals']) {
            outArray.push(entry[p['return_only_this_keys_vals']]);

          } else {
            outArray.push(entry);
          }
        }
      });

      let outObj = {};
      outObj['filename'] = filenamePrefix + "_" + cat + ".json";
      outObj['data'] = _.clone(outArray);
      outDataSets.push(outObj);


    });
    // console.log(outDataSets.length);

    return outDataSets;
  }




  extract_objs_not_referred_to(inDat, p, outArray) {
    let referredObjsIDs = this.extract_nested_objects_into_array(inDat, p['referred_objs']);
    console.log("referredObjsIDs: ", referredObjsIDs.length);

    let scrutinisedObjsIDs = this.extract_nested_objects_into_array(inDat, p['scrutinised_objs']);
    let origScrutinisedObjsIDs = _.clone(scrutinisedObjsIDs)
    console.log("scrutinisedObjsIDs: ", scrutinisedObjsIDs.length)

    let unreferredObjsIDs = _.pullAll(scrutinisedObjsIDs, referredObjsIDs);
    console.log("referredObjsIDs after pull: ", referredObjsIDs.length);
    console.log("scrutinisedObjsIDs after pull: ", scrutinisedObjsIDs.length);
    let pUnreferred = p['un_referred_objs'];
    let pMatchingObj = pUnreferred['matching_obj'];
    pMatchingObj['array_of_values'] = _.clone(referredObjsIDs);
    pUnreferred['matching_obj'] = _.clone(pMatchingObj);
    let unreferredObjs = this.extract_nested_objects_into_array(inDat, pUnreferred);

    return unreferredObjs;
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
          // console.log("ID: ", key);
          if (valToSearch === value) {
            matchedItem = item;
          }
        }
      });

    });
    return matchedItem;
  }

  // selects default to all
  select_entries(inData, p) {
    let possibleEntries = inData;
    console.log("p: ", p);
    _.forOwn(p['search_keys'], (vals, key) => {
      if (!_.isArray(vals)) {
        vals = [vals];
      }
      _.each(vals, (val) => {
        val = val.toLowerCase();
        if (val.includes('*')) {
          val = val.replace('*', '');
          possibleEntries = _.filter(possibleEntries, (obj) => {

            let objVal = obj[key].toLowerCase();
            return objVal.includes(val);
          });
        } else {
          possibleEntries = _.filter(possibleEntries, (obj) => {
            let objVal = obj[key].toLowerCase();
            return objVal === val;
          });
        }

      });
    });

    let keysToSelectP = _.keys(p['search_keys'])[0];
    this.su.print_blank_lines(2, " found entries ");
    console.log(this.select_subset_of_keys_from_arr(possibleEntries));

    return possibleEntries;
  }

  get_reference_dataset(origDat, p) {
    let referenceDat;
    let fluidDat;

    if (p['reference_file_key']) {
      p['reference_file_key'] = p['reference_file_key'].toLowerCase();
      _.forOwn(origDat, (dat, key) => {
        let keyLower = key.toLowerCase();
        if (keyLower.includes(p['reference_file_key'])) {
          console.log("populating reference data with ", key);
          referenceDat = _.clone(dat);
        } else {
          console.log("populating data to manip with ", keyLower);
          fluidDat = _.clone(dat);
        }
      });
    }

    return [referenceDat, fluidDat]
  }


  group_by( inDat, p ) {
    let newKeysByGroup = this.extract_nested_objects_into_array(inDat, p);
    // console.log("newKeysByGroup: ", newKeysByGroup);
    let outObjs;

    if (p['as_array']) {
      outObjs = {};
      _.each(newKeysByGroup, (newKey) => {
        _.each(inDat, (entry) => {

          if (entry[p['return_only_this_keys_vals']] === newKey) {
            if (!outObjs[newKey]) {
              outObjs[newKey] = [];
            }
            let outVal = entry[p['value_from_this_key']];
            // console.log(newKey, " ", outVal);
            outObjs[newKey].push(outVal);
          }
        });
      });
    } else {
      outObjs = [];
      _.each(inDat, (entry) => {
        let outObj = {};
        if (newKeysByGroup.includes(entry[p['return_only_this_keys_vals']])) {
          outObj[entry[p['return_only_this_keys_vals']]] = entry[p['value_from_this_key']];
        }
        outObjs.push(outObj);
      });
    }
    // console.log(outObjs);

    return outObjs;
  }

}
