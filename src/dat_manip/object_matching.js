// Handles identification of objects / entries. Essentially object searching

import 'lodash';
import DictArrUtils from "./dict_array_utils.js";

export default class ObjMatching {
  constructor() {
    this.da = new DictArrUtils();
  }

  check_obj_matches(obj, pArr) {

    pArr = this.da.make_arr_if_not(pArr);

    let objMatches = true;

    _.each(pArr, (p) => {

      switch (p['func']) {
        case 'check_obj_has_these_keys':
          // could be replaced with _.hasIn?
          objMatches = this.check_obj_has_these_keys(obj, p['keys_to_contain']);
          break;

        case 'check_obj_has_either_of_these_keys':
          // could be replaced with _.hasIn?
          objMatches = this.check_obj_has_either_of_these_keys(obj, p['keys_to_contain']);
          break;

        case 'check_obj_has_empty_vals_for_these_keys':
          // could be replaced with _.hasIn?
          objMatches = this.check_obj_has_empty_vals_for_these_keys(obj, p['keys_with_empty_vals']);
          break;

        case 'check_obj_contains_none_of_these_key_value_pairs':
          // could be replaced with _.matches?
          objMatches = this.check_obj_contains_none_of_these_key_value_pairs(obj, p['key_value_pairs']);
          break;

        case 'check_obj_contains_these_key_value_pairs':
          // could be replaced with _.matches?
          objMatches = this.check_obj_contains_these_key_value_pairs(obj, p['key_value_pairs']);
          break;

        case 'check_obj_contains_either_of_these_key_value_pairs':
          objMatches = this.check_obj_contains_either_of_these_key_value_pairs(obj, p['key_value_pairs']);
          break;

        case 'check_obj_contains_either_of_these_key_value_pairs_substring_match':

          let substringMatch = true;
          objMatches = this.check_obj_contains_either_of_these_key_value_pairs(obj, p['key_value_pairs'], substringMatch);
          break;

        case 'check_obj_contains_either_of_these_key_value_pairs_generate_from_arr':
          // could be replaced with _.hasIn?
          objMatches = this.check_obj_contains_either_of_these_key_value_pairs_generate_from_arr(obj, p['key_val_pair_key'], p['array_of_values']);
          break;

        case 'check_objs_shake_hands':
          // could be replaced with _.hasIn?
          objMatches = this.check_objs_shake_hands(obj, p);
          break;

        case 'check_obj_matches_exactly':
          objMatches = this.check_obj_matches_exactly(obj, p)
          break;

        case 'check_obj_has_this_key_hierarchy':
          objMatches = this.check_obj_has_this_key_hierarchy(obj, p['key_hierarchy'])
          break;

        case 'check_obj_has_string_val':
          objMatches = this.check_obj_has_string_val(obj, p['string_val'])
          break;

        case 'check_obj_does_not_match_exactly':
          objMatches = this.check_obj_does_not_match_exactly(obj, p)
          break;
      }
      if (!objMatches) {
        return false;
      }
    });
    return objMatches;
  }



  check_obj_matches_key_val(obj, keyValPair) {
    let thisObjectsKeys = _.keys(obj);
    let objectHasNecessaryKeys = true;
    _.each(keysToContain, (objKey) => {
      if (!thisObjectsKeys.includes(objKey)) {
        objectHasNecessaryKeys = false;
        return false;
      }
    });
    return objectHasNecessaryKeys;
  }


  check_obj_has_these_keys(obj, keysToContain) {
    let thisObjectsKeys = _.keys(obj);
    let objectHasNecessaryKeys = true;
    _.each(keysToContain, (objKey) => {
      if (!thisObjectsKeys.includes(objKey)) {
        objectHasNecessaryKeys = false;
        return false;
      }
    });
    return objectHasNecessaryKeys;
  }


  check_obj_has_either_of_these_keys(obj, keysToContain) {
    let thisObjectsKeys = _.keys(obj);
    let objectHasNecessaryKeys = false;
    _.each(keysToContain, (objKey) => {
      if (thisObjectsKeys.includes(objKey)) {
        objectHasNecessaryKeys = true;
        return false;
      }
    });
    if (objectHasNecessaryKeys) {
      console.log("object has nec keys: ", thisObjectsKeys);
    } else {
      // console.log("we're missing obj keys");
    }
    return objectHasNecessaryKeys;
  }



  check_obj_has_string_val(obj, p) {
    let valToCheck = obj[p['from_key']];
    let objHasString = true;
    // console.log("obj: ", obj);
    // console.log(p);

    if (p['match_value_contains']) {
      if (valToCheck.search(p['match_value_contains']) < 0) {
        objHasString = false;
      }
    }

    if (objHasString) {
      console.log("match ", valToCheck);
    }
    return objHasString;
  }


  check_obj_contains_either_of_these_key_value_pairs(obj, keyValuePairs, substringMatch) {
    let thisObjectsKeys = _.keys(obj);
    let objectHasRequiredKeyValPair = false;

    if (_.isPlainObject(obj)) {
      // console.log("ssM: ", substringMatch);
      // console.log(keyValuePairs, " obj: ", obj);

      keyValuePairs = this.da.make_arr_if_not(keyValuePairs);
      _.each(keyValuePairs, (keyValPair) => {

        let testKey = _.keys(keyValPair)[0];
        let testVal = _.values(keyValPair)[0];

        if (obj[testKey] && testVal) {
          if (!substringMatch) {
            if (obj[testKey] === testVal) {
              objectHasRequiredKeyValPair = true;
            }
          } else if (obj[testKey].indexOf(testVal) > -1) {
            objectHasRequiredKeyValPair = true;
          }
        }
      });
    }

    if (objectHasRequiredKeyValPair) {
      // console.log("match ", keyValuePairs);
    }

    return objectHasRequiredKeyValPair;
  }


  check_obj_contains_these_key_value_pairs(obj, keyValuePairs, substringMatch) {
    let thisObjectsKeys = _.keys(obj);
    let objectHasRequiredKeyValPair = true;

    if (_.isPlainObject(obj)) {
      // console.log("ssM: ", substringMatch);
      // console.log( keyValuePairs, " obj: ", obj );

      keyValuePairs = this.da.make_arr_if_not(keyValuePairs);
      _.each(keyValuePairs, (keyValPair) => {

        let testKey = _.keys(keyValPair)[0];
        let testVal = _.values(keyValPair)[0];

        // if (obj[testKey] && testVal) {
          if (!substringMatch) {
            if (obj[testKey] !== testVal) {
              // console.log("FAIL obj[testKey]: ", obj[testKey], " testVal ", testVal);
              objectHasRequiredKeyValPair = false;
            }
          } else if (obj[testKey].indexOf(testVal) < 0) {
            // console.log("FAIL objectHasRequiredKeyValPair: ", obj[testKey], " testVal ", testVal);
            objectHasRequiredKeyValPair = false;
          }
        // }
      });
    }

    if (objectHasRequiredKeyValPair) {
      // console.log("match ", keyValuePairs);
    }

    return objectHasRequiredKeyValPair;
  }


  check_obj_has_empty_vals_for_these_keys(obj, keysToCheck) {
    let thisObjectsKeys = _.keys(obj);
    let keyExistValEmpty = true;

    if (_.isPlainObject(obj)) {
      // console.log("ssM: ", substringMatch);


      keysToCheck = this.da.make_arr_if_not(keysToCheck);
      _.each(keysToCheck, (key) => {

        if (thisObjectsKeys.includes(key)){
          if (obj[key]){
            keyExistValEmpty = false;

            return false;
          }
        } else {
          keyExistValEmpty = false;
          return false;
        }
      });
    }

    return keyExistValEmpty;
  }




  check_obj_contains_either_of_these_key_value_pairs_generate_from_arr(obj, keyValPairKey, arrayOfValues) {
    let keyValuePairs = this.create_key_val_pairs_from_arr_of_vals(keyValPairKey, arrayOfValues);

    let doesMatch = this.check_obj_contains_either_of_these_key_value_pairs(obj, keyValuePairs);

    return doesMatch;
  }



  check_obj_contains_none_of_these_key_value_pairs(obj, keyValuePairs) {
    let thisObjectsKeys = _.keys(obj);
    let objectDoesNotHaveRequirements = true;
    // console.log("obj: ", obj);
    console.log("check_obj_contains_none_of_these_key_value_pairs: ", keyValuePairs);
    if (!_.isArray(keyValuePairs)) {
      keyValuePairs = [keyValuePairs];
    }
    _.each(keyValuePairs, (keyValPair) => {

      let testKey = _.keys(keyValPair)[0];
      let testVal = _.values(keyValPair)[0];
      // console.log(keyValPair);
      if (obj[testKey] === testVal) {

        objectDoesNotHaveRequirements = false;
        return false;
      }

    });

    if (objectDoesNotHaveRequirements) {
      console.log("objectDoesNotHaveRequirements: ", objectDoesNotHaveRequirements);
    } else {
      console.log("objectDoesNotHaveRequirements: ", objectDoesNotHaveRequirements);
    }

    return objectDoesNotHaveRequirements;
  }


  check_objs_shake_hands(refObj, p) {

    let objMatches = false;

    if (_.isPlainObject(refObj)) {
      let specimenObj = _.clone(p['obj_to_shake_hands_with']);
      // console.log("specimenObj: ", specimenObj);

      if ((refObj[p['ref_key']] === specimenObj[p['identifier_key']]) &&
        (refObj[p['identifier_key']] === specimenObj[p['specimen_key']])) {
        objMatches = true;
      }
    }

    return objMatches;
  }


  check_obj_matches_exactly(obj, p) {
    let objMatches = true;
    let objToMatchWith;
    if (p['obj_to_match_with']){
      objToMatchWith = p['obj_to_match_with'];
    } else {
      objToMatchWith = p;
    }

    _.forOwn(obj, (val, key) => {
      if (obj[key] !== objToMatchWith[key]) {
        objMatches = false;
        // console.log(obj[key], " dosnz match wif ", objToMatchWith[key]);
        return false;
      } else {
        console.log('');
        console.log(obj[key], " MATCHES EXACTLY ", objToMatchWith[key], " ", objMatches);

      }
    });
    return objMatches;
  }

  check_obj_has_this_key_hierarchy(obj, keyHierarchy, objMatches) {
    if (objMatches === undefined) {
      objMatches = true;
    }

    let objKeys = this.da.make_arr_if_not(_.keys(obj));
    let neededKeys = this.da.make_arr_if_not(_.keys(keyHierarchy));

    _.each(neededKeys, (neededKey) => {
      console.log("neededKey: ", neededKey)
      if (objKeys.includes(neededKey)) {
        console.log("obj: ", obj);
        console.log("keyHierarchy: ", keyHierarchy);
        let nextLevelKeys = _.keys(keyHierarchy[neededKey])
        _.each(nextLevelKeys, (nextLevelKey) => {
          objMatches = this.check_obj_has_this_key_hierarchy(obj[neededKey], keyHierarchy[neededKey], objMatches);
        });
      } else {
        objMatches = false;
        return false;
      }
    });
    if (objMatches) {
      console.log(obj, " matches ", objMatches);
    }

    return objMatches;
  }


  check_obj_does_not_match_exactly(obj, p) {

    let objDoesntMatch = false;
    let objToMatchWith = p['obj_to_match_with'];
    // console.log(" specobj: ", obj);
    // console.log(" objToMatchWith: ", objToMatchWith);
    _.each(p['keys_to_match'], (keyToMatch) => {
      console.log(objToMatchWith[keyToMatch], "  ", obj[keyToMatch])

      if (objToMatchWith[keyToMatch] !== obj[keyToMatch]) {
        objDoesntMatch = true;
        return false
      };
    });
    console.log('obj doesnt match = ', objDoesntMatch);
    return objDoesntMatch;
  }





  check_key_val_matches(key, val, p) {
    let matches = true;
    val = val.toLowerCase();
    if (p['matching_key']) {

      if (p['matching_key'].toLowerCase() !== key.toLowerCase()) {
        matches = false;
        return false;
      } else {
        // console.log(p['matching_key'], " matching_key ", key);
      }
    }
    if (p['match_value_contains']) {
      if (!val.includes(p['match_value_contains'].toLowerCase())) {
        matches = false;
        return false;
      } else {
        // console.log(p['matching_key'], " match_value_contains ", val);
      }
    }
    if (p['match_identically']) {
      // console.log(p['match_identically'], " m ", val.length);

      if ((p['match_identically'].indexOf(val) === 0) || (p['match_identically'].length === val.length)) {

      } else {
        matches = false;
        return false;
      }
    }

    return matches;
  }



  find_matching_nested_objs(inData, p, matchingObjs) {
    if (!matchingObjs) {
      matchingObjs = [];
    }

    if (_.isPlainObject(inData) && this.check_obj_matches(inData, p)) {
      // console.log("objMatches! ");
      // console.log("p: ", p);
      matchingObjs.push(inData);

    }
    if (_.isArray(inData)) {
      _.each(inData, (entry) => {
        matchingObjs = this.find_matching_nested_objs(entry, p, matchingObjs);

      });
    } else if (_.isPlainObject(inData)) {

      _.forOwn(inData, (val, key) => {
        matchingObjs = this.find_matching_nested_objs(val, p, matchingObjs);
      });
    }

    return matchingObjs;
  }


  obj_exists_in(inDat, objToMatchWith) {
    let p = {};
    p['func'] = 'check_obj_matches_exactly';
    p['obj_to_match_with'] = objToMatchWith;
    let outObjs = this.find_matching_nested_objs(inDat, p);
    if (outObjs.length > 0) {
      return true;
    } else {
      return false;
    }
  }



  key_val_pair_exists_in( inDat, keyValPair ) {
    let p = {};
    p['func'] = 'check_obj_contains_these_key_value_pairs';
    p['key_value_pairs'] = keyValPair;
    // console.log("p: ", p);

    let outObjs = this.find_matching_nested_objs(inDat, p);
    if (outObjs.length > 0) {
      // console.log("obj already exists in");
      console.log(outObjs);
      console.log(p);
      return true;
    } else {
      // console.log("key val pair does not exist!");
      return false;
    }
  }


}
