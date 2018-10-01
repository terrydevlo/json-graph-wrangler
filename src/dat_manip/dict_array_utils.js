// Handles data agnostic manipulations of arrays and dicts

import 'lodash';
import ObjMatching from "./object_matching.js";

export default class DictArrUtils {

  constructor(){

  }
  make_arr_if_not(inArr) {

    if (!_.isArray(inArr)) {
      inArr = [inArr];
    }
    return inArr;
  }

  subset_arr_of_objs(inArrOfObjs, keysToSubset, returnEmpties=false) {
    let outArr = [];

    _.each(inArrOfObjs, (entry) => {
        let pickedKeyVals = _.pick(entry, keysToSubset);
        if (pickedKeyVals){
          // console.log(_.values(pickedKeyVals));
          let pickedVals = _.values(pickedKeyVals);
          if (returnEmpties || (!pickedVals.includes("")) &&
                               (!pickedVals.includes(null)) &&
                               (!pickedVals.includes(undefined))){
            outArr.push(pickedKeyVals);
          }
        }
      });

    return outArr;
  }


  get_arr_of_vals_from_arr_dict_by_key(arrDicts, koi, returnEmpties=false){
    let outArr = [];
    _.each(arrDicts, (dict) => {
      if (returnEmpties || (dict[koi] !== "") &&
                           (dict[koi] !== null) &&
                           (dict[koi] !== undefined)){
         outArr.push(dict[koi])
      }
    });
    return outArr;
  }

  get_uniques_from_arr_dicts_of_key(){
    return _.uniq()
  }

  swap_key_val(inObj) {

    let outKey = _.values(inObj)[0];
    let outVal = _.keys(inObj)[0];
    let outObj = {};
    outObj[outKey] = outVal;

    return outObj;
  }

  // Refactor --- there are three functions that do this. Plus one in data_trans.

  swap_a_pair_of_keys_vals(inObj) {

    let outKeys = _.reverse(_.keys(inObj));
    let outVals = _.values(inObj);
    let outObj = _.zipObject(outKeys, outVals);

    return outObj;
  }


  find_key_with_this_val( inObj, matchingVal ){
    let matchedKey;
    _.forOwn(inObj, (v, k) => {
      if (v===matchingVal){
        matchedKey = k;
      }
    });

    return matchedKey;
  }


  flatten_obj( inObj ){
    console.log("Bef flat: ", inObj.length);
    this.print_keys(inObj);
    inObj = _.flatten(inObj);
    console.log("Aft flat: ", inObj.length);
    this.print_keys(inObj);
    return inObj;
  }



  check_obj_matches_exactly(obj, objToMatchWith) {
    let objMatches = true;

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


  slice( inDat, p ){
    let start, end;
    if (p['start']) { start = p['start']}
    if (p['end']) { end = p['end']}

    return _.slice( inDat, start, end );
  }


  get_all_keys(inObj) {
    let keys = [];
    if (_.isArray(inObj)) {
      _.each(inObj, (arr) => {
        let theseKeys = _.keys(arr);
        _.each(theseKeys, (thisKey) => {
          if (!keys.includes(thisKey)) {
            keys.push(thisKey);
          }
        });
      });
    }

    return keys;
  }


  create_key_val_pairs_from_arr_of_vals(inKey, inArrOfValues) {
    let newObjArr = [];
    _.each(inArrOfValues, (inVal) => {
      let newObj = {};
      newObj[inKey] = _.clone(inVal);
      newObjArr.push(newObj);
    });
    return newObjArr;
  }


  merge_internal_arrays_of_equivalent_data_hierarchy_old(obj1, obj2) {
    // NOTE: requires same hierarchical levels of obj1 and obj2.
    // Use build_obj_from_hierarchy prior to help here.

    let mergedObj;
    let alreadyMergedKeys = [];

    if (obj1 && !_.isEmpty(obj1)) {

      if (obj2 && !_.isEmpty(obj2)) {

        // if either present or past objects are arrays.
        if (_.isArray(obj2) || _.isArray(obj1)) {
          // make sure both are arrays
          obj2 = this.make_arr_if_not(obj2);
          obj1 = this.make_arr_if_not(obj1);

          // loop through array and merge matching vals and push to a temp array
          let objArr = [];
          let arrsToRemove = [];

          if (_.isPlainObject(obj2[0]) && _.isPlainObject(obj1[0])) {
            // console.log("looking for matching.")

            _.each(obj1, (v1) => {
              let itemObj = {};
              let v1Key = _.keys(v1)[0];
              alreadyMergedKeys.push(v1Key);

              _.each(obj2, (v2) => {
                if (_.isPlainObject(v1)) {
                  let v2Key = _.keys(v2)[0];
                  if (v1Key === v2Key) {
                    // console.log("matching obj1 and obj2 keys: ", v1Key);
                    // arrsToRemove.push(v2);
                    itemObj[v1Key] = this.merge_internal_arrays_of_equivalent_data_hierarchy_old(v1[v1Key], v2[v1Key]);
                  } else {

                  }
                }
              });
              if (_.isEmpty(itemObj[v1Key])) {
                itemObj[v1Key] = v1[v1Key];
                // console.log(itemObj[v1Key]);
              }
              if (_.isEmpty(itemObj)) {
                itemObj = v1;
              }
              objArr.push(itemObj);
              // console.log("objArr: ", objArr);

            });
            _.each(obj2, (v2) => {
              if (!arrsToRemove.includes(v2)) {
                // console.log("v2: ", v2);
                objArr.push(v2);
              }
            });
            // console.log("mergedObj: ", mergedObj);
            mergedObj = objArr;
          } else {
            // console.log("concat: ", obj1, " 2: ", obj2);
            mergedObj = _.concat(obj1, obj2);
            // console.log("mergedObj: ", mergedObj);

          }
        } else if (_.isPlainObject(obj1)) {
          _.forOwn(obj1, (v, k) => {
            // console.log("K isPlainObject(obj1): ", k);
            mergedObj[k] = this.merge_internal_arrays_of_equivalent_data_hierarchy_old(v, obj2[k]);
            // alreadyMergedKeys.push(k)

          });
        }

        // include any obj2 dict
        if (_.isPlainObject(obj2)) {
          _.forOwn(obj2, (v, k) => {
            console.log("K isPlainObject(obj2): ", k);
            // this fixed an issue with shooting blanks
            // if (!alreadyMergedKeys.includes(k)) {
            mergedObj[k] = v;
            // }
          });
        }
      }
      // obj2 empty, simply add obj1
      else {
        // console.log("KEYZ: ", _.keys(mergedObj));
        mergedObj = obj1;
      }
    } else {
      // console.log("KEYZ: ", _.keys(mergedObj));
      // console.log("out obj1 ", obj1, " out obj2: ", obj2);
      mergedObj = obj2;
    }
    console.log("RETURNED MERGED OBJ: ", mergedObj)
    return mergedObj;
  }


  merge_internal_arrays_of_equivalent_data_hierarchy(obj1, obj2) {
    // NOTE: requires same hierarchical levels of obj1 and obj2.
    // Use build_obj_from_hierarchy prior to help here.


    if (!obj1 || _.isEmpty(obj1)) {
      return obj2;
    } else if (!obj2 || _.isEmpty(obj2)) {
      return obj1;
    }

    let mergedObj;
    // if either present or past objects are arrays.
    if (_.isArray(obj2) || _.isArray(obj1)) {
      // make sure both are arrays
      obj2 = this.make_arr_if_not(obj2);
      obj1 = this.make_arr_if_not(obj1);


      // _.each(obj1, (item1) => {
      //   _.each(obj2, (item2) => {
      //
      //   });
      // });
      // make sure both are true arrays
      if (_.isPlainObject(obj2[0]) && _.isPlainObject(obj1[0])) {
        // console.log("obj1: ");
        // console.log(obj1);
        // console.log("obj2: ", obj2);

        // mergedObj = _.merge(obj1, obj2);
        // console.log("mergedObj: ", mergedObj);
        // there is an error here somewhere
        mergedObj = _.merge(obj1, obj2);
      } else {
        // console.log("concat obj1: ", obj1, " obj2: ", obj2);
        mergedObj = _.concat(obj1, obj2);
      }
    } else if (_.isPlainObject(obj2) || _.isPlainObject(obj1)) {
      mergedObj = {};
      let iteratedKeys = [];
      if (_.isPlainObject(obj1)) {
        _.forOwn(obj1, (v, k) => {
          iteratedKeys.push(k);
          if (_.isArray(v) || _.isArray(obj2[k]) || _.isPlainObject(v) || _.isPlainObject(obj2[k])) {
            console.log("v: ", v, " obj2[k]: ", obj2[k]);

            if (obj2[k] && v) {
              mergedObj[k] = this.merge_internal_arrays_of_equivalent_data_hierarchy(v, obj2[k]);
            } else {
              mergedObj[k] = _.merge(v, obj2[k]);
            }
          } else {
            // console.log(" two strings I believe: v: ", v, " obj2[k]: ", obj2[k]);
            // console.log("returning : ", v);
            mergedObj[k] = v;
          }
        });
      }
      if (_.isPlainObject(obj2)) {
        _.forOwn(obj2, (v, k) => {
          if (!iteratedKeys.includes(k)) {
            if (_.isArray(v) || _.isArray(obj1[k]) || _.isPlainObject(v) || _.isPlainObject(obj1[k])) {
              if (obj2[k] && v) {
                mergedObj[k] = this.merge_internal_arrays_of_equivalent_data_hierarchy(v, obj1[k]);
              } else {
                // console.log("v: ", v, " obj1[k]: ", obj1[k]);

                mergedObj[k] = _.merge(v, obj1[k]);
              }
            } else {
              // console.log("v: ", v, " obj1[k]: ", obj1[k]);
              mergedObj[k] = _.merge(v, obj1[k]);
            }
          }
        });
      }
    } else {
      mergedObj = _.concat(obj1, obj2);
    }

    return mergedObj;
  }



  diff_objs_of_equivalent_data_hierarchy(obj1, obj2) {
    // NOTE: requires same hierarchical levels of obj1 and obj2.
    // Use build_obj_from_hierarchy prior to help here.
    //

    if (!obj1 || _.isEmpty(obj1)) {
      return obj2;
    } else if (!obj2 || _.isEmpty(obj2)) {
      return obj1;
    }

    let mergedObj;
    // if either present or past objects are arrays.
    if (_.isArray(obj2) || _.isArray(obj1)) {
      // make sure both are arrays
      obj2 = this.make_arr_if_not(obj2);
      obj1 = this.make_arr_if_not(obj1);


      // make sure both are true arrays
      if (_.isPlainObject(obj2[0]) && _.isPlainObject(obj1[0])) {
        // console.log("obj1: ");
        // console.log(obj1);
        // console.log("obj2: ", obj2);

        // mergedObj = _.merge(obj1, obj2);
        // console.log("mergedObj: ", mergedObj);
        // there is an error here somewhere
        // mergedObj = _.pullAll(obj1, obj2);
        // let obj1diff = _.pullAll(obj2, obj1);
        // let obj2diff = _.pullAll(obj1, obj2);
        //
        // mergedObj = _.concat(obj1diff, obj2diff);
        mergedObj = [];

        _.each(obj1, (ent1) => {
          _.each(obj2, (ent2) => {
            let outEntry = this.diff_objs_of_equivalent_data_hierarchy(ent1, ent2);
            let objAlreadyExists = false;
            if (!_.isEmpty(outEntry) && _.isPlainObject(outEntry)){

              _.each(mergedObj, (mergedO) => {
                if (_.isPlainObject(mergedO)){
                  let objExs = this.check_obj_matches_exactly(mergedO, outEntry);
                  if (objExs) { objAlreadyExists = true; return false; }
                }
              });
            }
            if (!objAlreadyExists){
              if (outEntry && !mergedObj.includes(outEntry)){

                if (_.isPlainObject(outEntry) && !_.isEmpty(outEntry)){
                  mergedObj.push(outEntry);
                } else if (_.isArray(outEntry) && !_.isEmpty(outEntry)){
                  mergedObj.push( outEntry );
                }
              }
            }
          });
        });
        if (mergedObj && (!_.isEmpty(mergedObj))){
          mergedObj = _.uniq(_.compact(mergedObj));
        }

      } else {
        mergedObj = _.uniq(_.compact(_.pullAll(obj1, obj2)));
      }
    } else if (_.isPlainObject(obj2) || _.isPlainObject(obj1)) {
      mergedObj = {};
      let iteratedKeys = [];

      if (_.isPlainObject(obj1)) {

        _.forOwn( obj1, (v, k) => {
          iteratedKeys.push(k);
          if (_.isArray(v) || _.isArray(obj2[k]) || _.isPlainObject(v) || _.isPlainObject(obj2[k])) {

            if (obj2[k] !== v) {
              let outVal = this.diff_objs_of_equivalent_data_hierarchy(v, obj2[k]);
              if (!_.isEmpty(outVal)){
                if (_.isArray(outVal) && outVal.length > 0){
                  mergedObj[k] = outVal;
                } else {
                  mergedObj[k] = outVal;
                }
              }
            }

          } else if (obj2[k] !== v) {
            // console.log(" two strings I believe: v: ", v, " obj2[k]: ", obj2[k]);
            // console.log("returning : ", v);
            // mergedObj[k] = v;
          }
        });
      }

    } else if (obj1 !== obj2) {
      // mergedObj = obj1;
    }

    return mergedObj;
  }

  remove_duplicate_objects_in_arr(dat, origDat){
    if (_.isArray(dat)){

    }

    if (_.isPlainObject(dat)){

    }

    return dat;
  }



  print_keys(inDat, spacing) {
    if (!spacing) {
      spacing = "  ";
    }
    spacing += "  ";
    if (_.isArray(inDat)) {

      this.print_keys(inDat[0], spacing);

    } else if (_.isObject(inDat)) {

      _.forOwn(inDat, (val, key) => {

        if (isNaN(Number(key))) {
          console.log(spacing + key);
          // console.log( entry );
        }
        if (_.isArray(val)){
          console.log(spacing, val.length);
        }
        if (_.isArray(val) || _.isPlainObject(val)) {
          this.print_keys(val, spacing);
        }
      });
    }
  }



  print_values_from_keys(inDat, keysToPrint) {
    spacing += "  ";
    if (_.isArray(inDat)) {

      this.print_keys(inDat[0], spacing);

    } else if (_.isObject(inDat)) {

      _.forOwn(inDat, (val, key) => {

        if (isNaN(Number(key))) {
          console.log(spacing + key);
          // console.log( entry );
        }
        if (_.isArray(val) || _.isObject(val)) {
          this.print_keys(val, spacing);
        }
      });
    }
  }



  subtract_difference( inDat, inDat2 ) {


  }


  map_objects(obj, p) {
    switch (p['func']) {
      case 'get_common_words_in':
        // could be replaced with _.hasIn?
        return this.s_.get_common_words_in(obj, p['keys_to_contain']);
        break;
    }
  }


  delete_obj_from_array(objs, objToDelete, keysToMatchWith) {
    let outObjs = [];
    _.each(objs, (ob) => {
      let matchedObj = true;
      _.each(keysToMatchWith, (key) => {
        if (ob[key] !== objToDelete[key]) {
          matchedObj = false;
        }
      });
      if (!matchedObj) {
        outObjs.push(ob);
      }
    });
    return outObjs;
  }


  update_matching_object( arrOfObjs, matchByParams, newKey, newVal ) {

    return _.each(arrOfObjs, (entry) => {
      if (_.isPlainObject(entry)) {
        if (this.check_obj_matches(entry, matchByParams)) {
          entry[newKey] = newVal;
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


  merge_with_internal_arrays_concatenated(obj1, obj2) {

    // NOTE: requires same hierarchical levels of obj1 and obj2.
    // Use build_obj_from_hierarchy prior to help here.


    if (!obj1 || _.isEmpty(obj1)) {
      return obj2;
    } else if (!obj2 || _.isEmpty(obj2)) {
      return obj1;
    }

    let mergedObj;
    // if either present or past objects are arrays.
    if (_.isArray(obj2) || _.isArray(obj1)) {
      // make sure both are arrays
      obj2 = this.make_arr_if_not(obj2);
      obj1 = this.make_arr_if_not(obj1);


      mergedObj = _.concat(obj1, obj2);

    } else if (_.isPlainObject(obj2) || _.isPlainObject(obj1)) {
      mergedObj = {};
      let iteratedKeys = [];
      if (_.isPlainObject(obj1)) {
        _.forOwn(obj1, (v, k) => {
          iteratedKeys.push(k);
          if (_.isArray(v) || _.isArray(obj2[k]) || _.isPlainObject(v) || _.isPlainObject(obj2[k])) {
            if (obj2[k] && v) {
              mergedObj[k] = this.merge_with_internal_arrays_concatenated(v, obj2[k]);
            } else {
              mergedObj[k] = _.merge(v, obj2[k]);
            }
          } else {
            mergedObj[k] = v;
          }
        });
      }
      if (_.isPlainObject(obj2)) {
        _.forOwn(obj2, (v, k) => {
          if (!iteratedKeys.includes(k)) {
            if (_.isArray(v) || _.isArray(obj1[k]) || _.isPlainObject(v) || _.isPlainObject(obj1[k])) {
              if (obj2[k] && v) {
                mergedObj[k] = this.merge_with_internal_arrays_concatenated(v, obj1[k]);
              } else {
                mergedObj[k] = _.merge(v, obj1[k]);
              }
            } else {
              mergedObj[k] = _.merge(v, obj1[k]);
            }
          }
        });
      }
    } else {
      mergedObj = _.concat(obj1, obj2);
    }

    return mergedObj;
  }



  merge_with_internal_arrays_concatenated(obj1, obj2) {

    // NOTE: requires same hierarchical levels of obj1 and obj2.
    // Use build_obj_from_hierarchy prior to help here.


    if (!obj1 || _.isEmpty(obj1)) {
      return obj2;
    } else if (!obj2 || _.isEmpty(obj2)) {
      return obj1;
    }

    let mergedObj;
    // if either present or past objects are arrays.
    if (_.isArray(obj2) || _.isArray(obj1)) {
      // make sure both are arrays
      obj2 = this.make_arr_if_not(obj2);
      obj1 = this.make_arr_if_not(obj1);


      mergedObj = _.concat(obj1, obj2);

    } else if (_.isPlainObject(obj2) || _.isPlainObject(obj1)) {
      mergedObj = {};
      let iteratedKeys = [];
      if (_.isPlainObject(obj1)) {
        _.forOwn(obj1, (v, k) => {
          iteratedKeys.push(k);
          if (_.isArray(v) || _.isArray(obj2[k]) || _.isPlainObject(v) || _.isPlainObject(obj2[k])) {
            if (obj2[k] && v) {
              mergedObj[k] = this.merge_with_internal_arrays_concatenated(v, obj2[k]);
            } else {
              mergedObj[k] = _.merge(v, obj2[k]);
            }
          } else {
            mergedObj[k] = v;
          }
        });
      }
      if (_.isPlainObject(obj2)) {
        _.forOwn(obj2, (v, k) => {
          if (!iteratedKeys.includes(k)) {
            if (_.isArray(v) || _.isArray(obj1[k]) || _.isPlainObject(v) || _.isPlainObject(obj1[k])) {
              if (obj2[k] && v) {
                mergedObj[k] = this.merge_with_internal_arrays_concatenated(v, obj1[k]);
              } else {
                mergedObj[k] = _.merge(v, obj1[k]);
              }
            } else {
              mergedObj[k] = _.merge(v, obj1[k]);
            }
          }
        });
      }
    } else {
      mergedObj = _.concat(obj1, obj2);
    }

    return mergedObj;
  }



  map_objects_to_str_or_existing_key(inObj, newMapArr, onlyIfKeyFound, isNotStr) {

    let keysInObj = _.keys(inObj);
    // console.log("newMapArr: ", newMapArr);

    _.each(newMapArr, (newMap) => {
      // assuming str output
      if (onlyIfKeyFound === undefined) {
        if (_.keys(newMap).includes('onlyIfKeyFound')) {
          onlyIfKeyFound = newMap['onlyIfKeyFound'];
        } else {
          onlyIfKeyFound = false;
        }
      }

      if (isNotStr === undefined) {
        if (_.keys(newMap).includes('is_not_string')) {

          isNotStr = newMap['is_not_string'];
        } else {
          isNotStr = false;
        }
      }

      let outVal;
      // console.log("keysInObj: ", keysInObj);
      newMap['from_keys'] = this.make_arr_if_not(newMap['from_keys']);
      _.each(newMap['from_keys'], (fromKey) => {
        if (keysInObj.includes(fromKey)) {
          if (isNotStr) {
            outVal = _.clone(inObj[fromKey]);
          } else {
            if (!outVal) {
              outVal = "";
            }
            outVal += _.clone(inObj[fromKey]);
          }


        } else if (!onlyIfKeyFound) {
          // input is a str constant
          if (!outVal) {
            outVal = "";
          }
          outVal += fromKey;

        }

      });

      if (outVal!==null && outVal!==undefined) {
        console.log(outVal);
        inObj[newMap['new_key']] = outVal;

      }


    });

    return inObj;
  }


}
