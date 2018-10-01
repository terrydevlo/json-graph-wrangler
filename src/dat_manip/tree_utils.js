// Handles tree inference such as finding root, defining explicit connections between regions that are connected.

import 'lodash';
import DataIO from './data_io.js';
import StringUtils from './string_utils.js';
import DictArrUtils from "./dict_array_utils.js";
import DataSelect from "./data_select.js";
import DataTrans from "./data_trans.js";

export default class TreeUtils {

  constructor() {

    // this.su.cl(this);
    this.da = new DictArrUtils();
    this.ds = new DataSelect();
    this.dt = new DataTrans();
    this.su = new StringUtils();

  }

  map_connected_as_trees(treeDat, origDat, p) {

    let keysToSelectP = _.concat([], p['id_key'], p['target_key'], p['source_key']);

    let newConnection;
    let newTrees = [];
    treeDat = _.each(treeDat, (tree) => {
      let treeName = tree[p['id_key']];
      if (treeName.length > 0) {
        let newTree = {};

        let matchingObj = {};
        _.each(p['matching_keys'], (matchingKey) => {
          matchingObj[matchingKey] = tree[matchingKey];
        });

        let children = _.filter(origDat, _.iteratee(matchingObj));

        // this.su.cl('Input CHILDREN: ', children.length);
        //
        // _.each(children, (ent) => {
        //   let treeKeys = _.keys(tree);
        //   p['keys_to_select'] = keysToSelectP;
        //   this.su.cl(this.ds.select_subset_of_keys_from_arr([ent], p));
        // });

        let minimalChildren = [];
        let nextVal;
        let previousVal;
        let rootName;

        _.each(children, (child) => {

          let newVals = null;
          if (child[p['is_root_key']]) {
            rootName = child[p['id_key']];
          }

          // first populate this > next
          if (child[p['target_key']] && child[p['target_key']] !== "") {
            let newKey = child[p['id_key']];
            newVals = child[p['target_key']];

            if (!_.isArray(newVals)) {
              // this.su.cl("newVals: ", newVals);
              newVals = [newVals];
            }

            _.each(newVals, (newVal) => {
              let valid = true;
              if (p['matching_keys']) {
                nextVal = _.find(origDat, [p['id_key'], newVal]);
                valid = _.filter([nextVal], _.iteratee(matchingObj));
                if (valid.length === 0) {
                  valid = false;
                }
              }

              if (p['mis_matching_key']) {
                nextVal = _.find(origDat, [p['id_key'], newVal]);
                valid = nextVal[p['mis_matching_key']] !== child[p['mis_matching_key']];
              }

              if (valid && newKey && newVal) {
                newConnection = {};
                newConnection[newKey] = newVal;

                if (_.find(minimalChildren, [newKey, newVal])) {
                  // this.su.cl(" ##$!%# this entry is already present! ");
                } else {
                  minimalChildren.push(newConnection);
                }
              }
            });
          }

          // then populate previous > this
          if (child[p['source_key']] && child[p['source_key']] !== "") {
            // this.su.cl("child: ", child);
            let newKeys = child[p['source_key']];
            let newVal = child[p['id_key']];

            if (!_.isArray(newKeys)) {
              newKeys = [newKeys];
            }

            _.each(newKeys, (newKey) => {
              let valid = true;
              if (p['matching_keys']) {
                nextVal = _.find(origDat, [p['id_key'], newKey]);
                valid = _.filter([nextVal], _.iteratee(matchingObj));
                if (valid.length === 0) {
                  valid = false;
                }
              }
              if (p['mis_matching_key']) {
                nextVal = _.find(origDat, [p['id_key'], newKey]);
                valid = nextVal[p['mis_matching_key']] !== child[p['mis_matching_key']];
              }

              if (valid && newKey && newVal) {
                newConnection = {};
                newConnection[newKey] = newVal;

                if (_.find(minimalChildren, [newKey, newVal])) {
                  // this.su.cl(" ##$!%# this entry is already present! ");
                } else {
                  minimalChildren.push(newConnection);
                }
              }
            });
          }
        });

        // this.su.cl("minimalChildren length: ", minimalChildren);
        // this needs tidying up:
        if (minimalChildren && (minimalChildren.length > 0)) {
          minimalChildren = this.ensure_root_is_source(minimalChildren, rootName, p);
          // minimalChildren = this.check_edge_ordering( minimalChildren, rootName, p);
          // check if need to split tree.
          if (p['one_tree_for_each_root_branch']) {
            newTree = this.get_ordered_trees_from_root(minimalChildren, rootName, p, treeName);

            // let branchesFromRoot = this.get_branches(treeName, rootName, minimalChildren);
          } else {
            // for each name and children pair
            if (p['append_suffix_to_tree']) {
              treeName += p['append_suffix_to_tree'];
            }
            // returning an additional null if min children = 1??
            // minimalChildren = this.order_children(minimalChildren, origDat, p['is_root_key'], p['id_key']);
            if (p['key_type'].toLowerCase() === "by_numeric_order") {
              newTree = _.merge(newTree, minimalChildren);
            } else if (p['key_type'].length > 0) {
              newTree[treeName] = minimalChildren;
            } else {
              newTree = _.each(minimalChildren, (child) => {
                _.merge(newTree, child);
              });
            }
          }
          newTrees.push(newTree);
        }
      }
    });

    return _.flatten(newTrees);
  }

  make_tree_from_unconnected(treeDat, origDat, p) {

    let newTrees = [];
    let pMatchingObj = {};


    treeDat = _.each(treeDat, (tree) => {


      let children = _.filter(origDat, _.iteratee(tree));
      let nChildren = children.length;
      let links = [];
      let nodes = [];
      let lyphs = [];
      let root;
      let leaf;

      let defaultNode = {};
      defaultNode['group_type'] = tree['group_type'];
      defaultNode['type'] = "node";
      defaultNode['type2'] = "invisible";


      _.each(children, (child, i) => {
        let nI = i+1;
        let nodePrefix = "N"
        let edgePrefix = "V";
        let targetLyph;

        let sourceNode = _.clone(defaultNode);
        let targetNode =  _.clone(defaultNode);

        lyphs.push(child.name);

        if (i === 0) {
          tree['root'] = child.name;
          nodePrefix = "R";
          sourceNode['root_lyph'] = child.name;
        }
        sourceNode['name'] = nodePrefix + i + " -- " + child.name + " node";
        sourceNode['label'] = sourceNode['name'];

        if (i === (nChildren - 1)) {
          nodePrefix="T";
          targetLyph = "___ " + child.name;
        } else {
          nodePrefix="N";

          targetLyph = children[i+1].name;
        }

        targetNode['name'] = nodePrefix + nI + " -- " + targetLyph + " node";
        targetNode['label'] = targetNode['name'];

        nodes.push(sourceNode);

        if (i === (nChildren - 1)) {
          nodes.push(targetNode);
        }


        let link = {};
        link['conveyingLyph'] = child.name;
        link['type'] = "link";
        link['type2'] = "invisible";

        link['group_type'] = tree['group_type'];

        link['source'] = sourceNode['name'];
        link['target'] = targetNode['name'];


        link['name'] = link['source'] + " -- " + link['target'] + " link";

        link['label'] = link['label'];

        links.push(link);

      });

      tree['name'] = tree['group_type'] + " group";
      tree['links'] = links;
      tree['nodes'] = nodes;
      tree['lyphs'] = lyphs;


      tree['visible_links'] = false;
      // console.log(children);
      // console.log(tree);
      // throw new Error();


    });
    console.log(treeDat);

    return treeDat;
  }



  audit_connected_order(arrToAudit, p) {
    // let keysToSelectP = _.concat([], p['id_key'], p['source_key'], p['target_key']);
    // this.su.print_blank_lines(3, "before AUDIT");
    // this.su.cl(this.select_subset_of_keys_from_arr(arrToAudit, keysToSelectP));

    let cleanedEntries = [];

    _.each(arrToAudit, (entry) => {
      if (entry[p['source_key']]) {
        let prevEntries = entry[p['source_key']];
        _.each(prevEntries, (prevEntry) => {
          // check if entry's previous-entries' next-entries reference entry
          let prevMatch = _.find(arrToAudit, [p['id_key'], prevEntry]);
          // only audit referenced items within existing array.
          if (prevMatch) {
            if (!prevMatch[p['target_key']].includes(entry[p['id_key']])) {
              entry[p['source_key']] = _.remove(prevEntries, (item) => {
                return item === prevMatch[p['id_key']];
              });
            }
          }
          // this.su.cl( this.select_subset_of_keys_from_arr( [prevMatch], keysToSelectP ) );
        });
      } else {

      }
      cleanedEntries.push(entry);

    });

    // this.su.print_blank_lines(3, "*after* AUDIT");
    // this.su.cl(this.select_subset_of_keys_from_arr(arrToAudit, keysToSelectP));
    return cleanedEntries;
  }

  enforce_connected_order_from_seq_arr(arrPrevToNext, p) {
    let outOrder = [];

    let compPrevs = _.cloneDeep(_.initial(arrPrevToNext));
    compPrevs.unshift(undefined);

    let compNexts = _.cloneDeep(_.tail(arrPrevToNext));
    compNexts.push(undefined);
    let keysToSelectP = _.concat([], p['id_key'], p['source_key'], p['target_key']);
    // this.su.print_blank_lines(3, "PREVS");
    // this.su.cl(this.select_subset_of_keys_from_arr(compPrevs, keysToSelectP));
    // this.su.print_blank_lines(3, "NEXTS");
    // this.su.cl(this.select_subset_of_keys_from_arr(compNexts, keysToSelectP));
    // this.su.print_blank_lines(3, "PREVS TO NEXT");
    // this.su.cl(this.select_subset_of_keys_from_arr(arrPrevToNext, keysToSelectP));
    // this.su.cl("compPrevs: ", compPrevs);
    // this.su.cl("compNexts: ", compNexts);
    // this.su.cl("arrPrevToNext: ", arrPrevToNext);

    _.zipWith(arrPrevToNext, compPrevs, compNexts, (prevToNext, prev, next) => {
      if (prev) {
        if (_.isArray(prevToNext[p['source_key']]) && !prevToNext[p['source_key']].includes(prev[p['id_key']])) {
          prevToNext[p['source_key']].push(prev[p['id_key']]);
        } else {
          prevToNext[p['source_key']] = [prev[p['id_key']]];
        }
      }
      if (next) {
        if (_.isArray(prevToNext[p['target_key']]) && !prevToNext[p['target_key']].includes(next[p['id_key']])) {
          prevToNext[p['target_key']].push(next[p['id_key']]);
        } else {
          prevToNext[p['target_key']] = [next[p['id_key']]];
        }
      }
      outOrder.push(prevToNext);
      // }
    });

    // this.su.print_blank_lines(10, " == OUT ==");
    // this.su.cl(this.select_subset_of_keys_from_arr(arrPrevToNext, keysToSelectP));
    return outOrder;
  }

  insert_tree_pattern_between_connected(connectedPair, p) {
    let keysToSelectP = _.concat([], p['id_key'], p['source_key'], p['target_key'], p['comparator_key']);

    let newLyphs = [];
    let cleanedConnectedPair = [];
    this.su.cl('');
    this.su.cl("== Inserting tree pattern.")
    // make sure there are no duplicated pairs
    let pairNames = [];
    _.each(connectedPair, (entry) => {
      pairNames.push(entry[p['id_key']]);
      // this.su.cl('');
      let otherItem = _.clone(connectedPair);
      otherItem = _.remove(otherItem, (item) => {
        return item[p['id_key']] !== entry[p['id_key']];
      });
      otherItem = otherItem[0];
      let prevEntries = entry[p['source_key']];
      if (entry[p['source_key']].includes(otherItem[p['id_key']])) {
        entry[p['source_key']] = _.remove(prevEntries, (item) => {
          return item[p['id_key']] === otherItem[p['id_key']];
        });
      }
      let nextEntries = entry[p['target_key']];

      if (entry[p['target_key']].includes(otherItem[p['id_key']])) {

        entry[p['target_key']] = _.remove(nextEntries, (item) => {
          return item[p['id_key']] === otherItem[p['id_key']];
        });
      }
      cleanedConnectedPair.push(entry);

    });
    this.su.cl("pairNames: ");
    this.su.cl(pairNames);
    //

    // this.su.print_blank_lines(3, "unclean");
    // this.su.cl( this.select_subset_of_keys_from_arr( connectedPair, keysToSelectP ) );
    //
    // this.su.print_blank_lines(3, "clean");
    // this.su.cl( this.select_subset_of_keys_from_arr( cleanedConnectedPair, keysToSelectP ) );
    //
    let templateLyph = _.cloneDeep(cleanedConnectedPair[0]);
    let previousLyph = templateLyph;
    let newLyphNames = [];

    _.each(p['new_types'], (newType) => {

      let newLyph = _.cloneDeep(templateLyph);
      // this.su.cl('')
      // this.su.cl( this.select_subset_of_keys_from_arr( [newLyph], keysToSelectP ) );

      newLyph[p['new_types_by_key']] = newType;
      newLyph[p['source_key']] = [previousLyph[p['id_key']]];
      newLyph[p['target_key']] = "";

      newLyph[p['id_key']] = this.dt.map_valStr_from_array_of_keys(newLyph, p['generate_id_from_these_keys']);
      newLyphs.push(newLyph);
      previousLyph = newLyph;
      newLyphNames.push(newLyph[p['id_key']]);
    });

    // Add original
    newLyphs.unshift(cleanedConnectedPair[0]);
    newLyphs.push(cleanedConnectedPair[1]);
    // this.su.cl("PRIOR ENFOCEMENT");
    // this.su.cl(this.select_subset_of_keys_from_arr(newLyphs, keysToSelectP));
    // this.su.print_blank_lines(5);

    newLyphs = this.enforce_connected_order_from_seq_arr(newLyphs, p);
    newLyphs = this.audit_connected_order(newLyphs, p);

    // //
    // this.su.print_blank_lines(5);
    // this.su.cl("post");
    // this.su.cl(this.select_subset_of_keys_from_arr(newLyphs, keysToSelectP));

    return newLyphs;
  }


  extract_invalid_connections(dat, p) {
    // include these p with
    let modifyStepParams = _.defaultsDeep(p['modify_step'], p);

    let alreadyFixed = [];


    let outDat = [];
    _.each(dat, (entry) => {
      let entriesToReplaceWith = [];
      let connectedPairs = [];
      let sourceEntry;
      let targetEntry;

      let keysToSelectP = _.concat([], p['id_key'], p['target_key'], p['source_key']);

      if (!_.isArray(entry[p['target_key']]) && entry[p['target_key']] !== '' && entry[p['target_key']] !== null) {
        entry[p['target_key']] = [entry[p['target_key']]];
      }
      if (!_.isArray(entry[p['source_key']]) && entry[p['source_key']] !== '' && entry[p['source_key']] !== null) {
        entry[p['source_key']] = [entry[p['source_key']]];
      }

      if (_.isArray(entry[p['target_key']]) || _.isArray(entry[p['source_key']])) {

        // Get the required keys that need to match, and set
        // the require key object values to the entries matching key value
        let matchingObj = {};
        _.each(p['matching_keys'], (matchingKey) => {
          matchingObj[matchingKey] = entry[matchingKey];
        });

        let possibleIllegals = _.filter(dat, _.iteratee(matchingObj));
        if (possibleIllegals.length > 1) {
          // this.su.cl(entry[p['target_key']], " ", entry[p['source_key']]);

          _.each(entry[p['target_key']], (nextEntry) => {
            if (nextEntry !== '' && nextEntry !== null) {
              let nextConnected = _.find(possibleIllegals, [p['id_key'], nextEntry]);
              // check there is a next connected and that is not the same as the idkey
              if (nextConnected && nextConnected[p['id_key']] !== entry[p['id_key']]) {
                // this.su.cl("NEXT: ", entry[p['target_key']], nextConnected[p['id_key']]);

                connectedPairs.push([entry, nextConnected]);
              }
            }
          });

          _.each(entry[p['source_key']], (previousEntry) => {
            if (previousEntry !== '' && previousEntry !== null) {
              if (entry[p['source_key']] !== '' && entry[p['source_key']] !== null) {
                let previousConnected = _.find(possibleIllegals, [p['id_key'], previousEntry]);
                if (previousConnected && previousConnected[p['id_key']] !== entry[p['id_key']]) {
                  // this.su.cl("PREV: ", entry[p['source_key']], previousConnected[p['id_key']]);

                  connectedPairs.push([previousConnected, entry]);
                }
              }
            }
          });
          // this.su.print_blank_lines(5);

          if (connectedPairs.length > 0) {
            // this.su.cl('');
            // this.su.cl("CPsssss: ", this.ds.select_subset_of_keys_from_arr(connectedPairs, keysToSelectP));
            // this.su.print_blank_lines(3, "before AUDIT");
            // _.each(origDat, (ent) => {
            //   this.su.cl( this.ds.select_subset_of_keys_from_arr( ent, keysToSelectP ) );

            _.each(connectedPairs, (connectedPair) => {
              // this.su.cl('');
              // this.su.cl("CPsssss: ", this.ds.select_subset_of_keys_from_arr(connectedPair, keysToSelectP));

              sourceEntry = connectedPair[0];
              targetEntry = connectedPair[1];

              if (!alreadyFixed.includes(sourceEntry[p['id_key']]) && !alreadyFixed.includes(targetEntry[p['id_key']])) {
                let sourceIllegal = p['illegally_connected'][0];
                let targetIllegal = p['illegally_connected'][1];
                let sourceIllegalType = sourceEntry[p['comparator_key']].includes(sourceIllegal);
                let targetIllegalType = targetEntry[p['comparator_key']].includes(targetIllegal);

                // "Tests"
                if (sourceIllegalType && targetIllegalType) {
                  // this.su.cl("illegal pair!!!");
                  // pairsTested.push([sourceIllegalType, targetIllegalType]);

                  switch (modifyStepParams["function"]) {
                    case 'insert_tree_pattern_between_connected':
                      entriesToReplaceWith = _.concat(entriesToReplaceWith, this.insert_tree_pattern_between_connected(connectedPair, modifyStepParams));
                      break;
                  }
                  _.each(entriesToReplaceWith, (replaceWith) => {

                    if (replaceWith) {
                      alreadyFixed = _.concat(alreadyFixed, replaceWith[p['id_key']]);
                    }
                  });
                }
              }
            });
          }
        }
      }

      if (entriesToReplaceWith.length > 0) {
        // this.su.cl("entriesToReplaceWith: ", entriesToReplaceWith);
        outDat = this.dt.delete_entry_by(outDat, p['id_key'], sourceEntry[p['id_key']]);
        outDat = this.dt.delete_entry_by(outDat, p['id_key'], targetEntry[p['id_key']]);
        outDat = _.concat(outDat, entriesToReplaceWith);
      } else {
        // this.su.cl("rowdy");
        // this.su.cl(entry);
        outDat.push(entry);
      }

    });
    // this.su.cl(alreadyFixed);

    return _.flatten(outDat);
  }

  order_children(children, allDat, is_rootKey, idKey) {
    // returning an additional null if min children = 1??

    // Check if root defined in children
    // this.su.cl(_.keys(children));
    let allKeys = [];
    let allValues = [];

    _.each(children, (child) => {
      allKeys.push(_.keys(child)[0]);
      allValues.push(_.values(child));
    });

    let rootKey;

    // find explicit root key
    _.each(allKeys, (key) => {
      let thisEntry = _.find(allDat, [idKey, key]);
      if (_.keys(thisEntry).includes(is_rootKey)) {
        if (thisEntry[is_rootKey]) {
          rootKey = entry['name'];
          this.su.cl("WE HAVE A ROOT!");
        }
      }
    });

    // if no root was explicitly specified,  find one:
    // ( one that isn't referenced as a next lyph )
    if (!rootKey) {
      _.each(allKeys, (key) => {
        if (!allValues.includes(key)) {
          rootKey = key;
        }
      });
    }

    // Get full root object
    let rootObject;
    let rootObjectKey;
    let rootObjectVal;

    _.each(children, (child) => {
      if (_.keys(child)[0] === rootKey) {
        rootObject = child;
        rootObjectKey = _.keys(child)[0];
        rootObjectVal = child[rootObjectKey];
      }
    });

    let outChildren = [];

    // Iterate children and push those who key matches the value
    // of the root object
    let tempChildren;
    outChildren.push(rootObject);

    while (children.length > 0) {

      // Remove root object from possible next child.
      tempChildren = [];
      _.each(children, (child) => {

        if (child !== rootObject) {
          tempChildren.push(child);
          return child;
        } else {
          // this.su.cl("deleting!!", child);
        }
      });
      children = tempChildren;

      rootObject = null;

      // this out
      _.each(children, (child) => {
        let childKey = _.keys(child)[0];
        let childVal = _.values(child)[0];

        if (childKey === rootObjectVal) {
          rootObject = child;
          rootObjectKey = _.keys(child)[0];
          rootObjectVal = child[rootObjectKey];
        }
      });

      // Couldn't find a root object, use next object in children
      if (!rootObject) {
        rootObject = children.shift();
      }

      outChildren.push(rootObject);
    }

    return outChildren;

  }



  get_highest_parent_level(parentsTraversed, inDat, parentalKey, idKey) {
    this.su.print_blank_lines(10);
    this.su.cl(" ==== beginning highest parent level search! ");
    let highestParent;
    let highestParentalLevel = -1;
    // let highestOrderParent = this.get_highest_parent_level( parentsTraversed, inDat, p['parent_key'], p['id_key'] );
    let keysToSelectP = _.concat([], parentalKey, idKey);
    // this.su.cl("in get highest");
    _.each(inDat, (entry) => {
      let currParentalLevel = 0;
      let entryParentID = entry[parentalKey];

      let currParent;

      // while there are entries with parents
      while (entry && entry[idKey] && entryParentID && entryParentID.length > 0) {
        // check if entry is a parent


        // get the parent entry and make it the current entry;
        let childEntry = entry;

        entry = _.find(inDat, [idKey, entryParentID]);

        // if the parent entry exists
        if (entry) {

          // get the next parentID
          // this.su.cl(this.su.abbr(entry[ idKey ],6), " is a parent of  ", this.su.abbr(childEntry[ idKey ],6));
          this.su.cl(entry);
          this.su.cl("name: ", entry[idKey], "entryParentID: ", entryParentID)

          if (entryParentID) {
            currParent = entry[idKey];
            currParentalLevel++;
          }

          entryParentID = entry[parentalKey];


        } else {
          this.su.cl("undefined idkey for : ", childEntry[idKey], " ", entryParentID);

        }

        if (!parentsTraversed.includes(currParent) && currParent && currParentalLevel > highestParentalLevel) {
          this.su.cl("parents traversed: ", parentsTraversed);
          highestParentalLevel = currParentalLevel;
          highestParent = currParent;
        }

      }

    });
    // this.su.cl("PT: ", parentsTraversed);
    // this.su.cl("== RETURNING highestParent: ", highestParent);
    this.su.print_blank_lines(5);
    return highestParent;
  }



  map_container_graph(inDat, p) {
    // this.su.cl("inDAT", inDat);
    let outGraph = {};
    let parentsTraversed = [];
    let highestOrderParent = this.get_highest_parent_level(parentsTraversed, inDat, p['parent_key'], p['id_key']);
    let keysToSelectP = _.concat([], p['id_key'], p['parent_key']);

    // this.su.cl("highestOrderParent: ", highestOrderParent);
    while (highestOrderParent) {
      // this.su.cl('');
      // this.su.cl("parentsTraversed: ", parentsTraversed);
      parentsTraversed.push(highestOrderParent);

      let children = _.filter(inDat, [p['parent_key'], highestOrderParent]);
      let minimalChildren = [];
      let insertedVals = [];
      let nConnections = 0;
      // this.su.cl('');
      // this.su.print_blank_lines(3, "== MATCHING CHILDREN");
      // _.each(children, (ent) => {
      //   this.su.cl( this.ds.select_subset_of_keys_from_arr( [ent], keysToSelectP ) );
      // });


      _.each(children, (child) => {

        let newKey = child[p['id_key']];

        if (newKey !== "") {
          let outObj = {};
          outObj[newKey] = {};

          let alreadyIn = false;
          _.each(minimalChildren, (minimalChild) => {
            // this.su.cl("mc: ", minimalChild, " outObj: ", outObj);
            if (_.keys(minimalChild)[0] === newKey) {
              alreadyIn = true;
            } else {
              // this.su.cl(" minimalChild: ", minimalChild);
            }
          });

          if (!alreadyIn) {
            // this.su.cl("minimalChildren: ", minimalChildren);
            minimalChildren.push(outObj);
          }
        }

      });

      if (minimalChildren.length > 0) {
        let tempGraphHierarchy = this.get_hierarchical_order(inDat, p['parent_key'], p['id_key'], highestOrderParent);
        this.su.cl("tempGraphHierarchy: ", tempGraphHierarchy);

        // tempGraphHierarchy.push(highestOrderParent);

        // this.su.cl("minChildren: ", minimalChildren);
        let tempGraph = this.build_obj_from_hierarchy(tempGraphHierarchy, minimalChildren);
        this.su.cl("tempGraph: ", tempGraph);
        this.su.cl("outGraph prior: ", outGraph);
        this.su.cl('');
        outGraph = this.da.merge_internal_arrays_of_equivalent_data_hierarchy(outGraph, tempGraph);
        this.su.cl('');
        this.su.cl("outGraph post: ", outGraph);
        this.su.cl('');



      } else {
        this.su.cl("minimal children was less than 1.");
      }

      highestOrderParent = this.get_highest_parent_level(parentsTraversed, inDat, p['parent_key'], p['id_key']);
    }

    return outGraph;
  }

  build_obj_from_hierarchy(hierarchy, values) {
    let newObj = {};
    let nextKey = hierarchy.shift();

    if (hierarchy.length > 0) {
      // this.su.cl("hierarchy: ", hierarchy);
      newObj[nextKey] = this.build_obj_from_hierarchy(hierarchy, values);

    } else {
      newObj[nextKey] = values;
    }

    if (_.isEmpty(newObj)) {
      newObj = [];
    }
    return newObj;
  }


  get_hierarchical_order(inDat, parentKey, idKey, currHighestOrder) {
    let outHierarchy = [];
    let inEntry = _.find(inDat, [idKey, currHighestOrder]);
    // this.su.cl("inEntry: ", inEntry);
    if (inEntry) {
      if (inEntry[idKey] !== '') {
        outHierarchy.unshift(inEntry[idKey]);
      }
      if (inEntry[parentKey] !== '') {
        outHierarchy.unshift(this.get_hierarchical_order(inDat, parentKey, idKey, inEntry[parentKey]));
      }
    }
    // if ( outHierarchy[0] === '' ) {
    //   outHierarchy.shift();
    // }
    if (outHierarchy.length === 0) {
      outHierarchy = [];
    }
    return _.flattenDeep(outHierarchy);
  }


  get_root(inEdges, p) {
    let possibleRoots = [];
    let possibleLeaves = [];
    _.each(inEdges, (edge) => {
      possibleRoots.push(edge[p['source_key']]);
      possibleLeaves.push(edge[p['target_key']]);
    });
    // this.su.cl("possibleRoots: ", possibleRoots);
    // this.su.cl("possibleLeaves: ", possibleLeaves);

    possibleRoots = _.difference(possibleRoots, possibleLeaves);
    // this.su.cl(possibleRoots);
    return possibleRoots[0];

  }

  ensure_root_is_source(edges, rootName, p) {
    let fixedEdges = [];
    let newRootEdge = {};
    _.each(edges, (edge) => {
      newRootEdge = _.clone(edge);

      if (_.values(edge).includes(rootName)) {

        // if trees are nameled source: lyph, target:lyph.
        if (edge[p['source_key']] || edge[p['target_key']]) {
          if (edge[p['source_key']] !== rootName) {
            // root is not source -- therefore swap source and target
            newRootEdge = {};

            newRootEdge[p['source_key']] = rootName;
            newRootEdge[p['target_key']] = edge[p['source_key']];
          }
        } else {
          newRootEdge = this.da.swap_key_val(edge);
        }
      }
      fixedEdges.push(newRootEdge);

    });
    return fixedEdges;
  }


  get_ordered_trees_from_root(edges, rootName, p, treeName) {
    if (edges.length === 1) {
      return edges;
    }


    let nextRoots;
    let failedEdges = [];
    let origBranchesEdge = _.filter(edges, _.iteratee(rootName));

    let outTrees = {};

    let branchName = "";

    // to not duplicate nodes in different trees
    let rootsVisited = [];

    // create a tree for each branch
    _.each(origBranchesEdge, (origBranchEdge) => {


      // SETUP BRANCH
      let otherBranches = _.clone(origBranchesEdge);
      otherBranches = _.remove(otherBranches, (otherBranch) => {
        return otherBranch !== origBranchEdge;
      });
      // this.su.cl(origBranchesEdge);
      // this.su.cl(otherBranches);

      if (p['append_branch_difference_to_tree_name']) {
        branchName = _.values(origBranchEdge)[0];

        _.each(otherBranches, (otherBranch) => {
          branchName = this.su.get_str_as_diff_between_words_from_both_arrays(branchName, _.values(otherBranch)[0]);
        });

      }

      if (p['append_suffix_to_tree']) {
        branchName += p['append_suffix_to_tree'];
      }


      let otherBranch1stLevel = [];

      _.each(otherBranches, (otherBranch) => {
        otherBranch1stLevel.push(_.values(otherBranch)[0]);
      });

      branchName = _.join([treeName, branchName], " ");
      outTrees[branchName] = [];


      // COMPLETE BRANCH
      let nextRoots = [_.values(origBranchEdge)[0]];
      let newEdges = [];
      newEdges.push(origBranchEdge);

      while (nextRoots.length !== 0) {
        _.each(nextRoots, (nextRoot) => {
          nextRoots = [];
          rootsVisited.push(nextRoot);
          _.each(edges, (edge) => {
            let newEdge;
            let edgeTarget = _.values(edge)[0];
            let edgeSource = _.keys(edge)[0];
            if (rootName !== edgeTarget && rootName !== edgeSource) {
              if (edgeSource === nextRoot) {
                newEdge = edge;
              }
              if (edgeTarget === nextRoot) {
                newEdge = this.da.swap_key_val(edge);

              }

              if (newEdge) {
                let newEdgeTarget = _.values(newEdge)[0];
                let newEdgeSource = _.keys(newEdge)[0];
                // let forComparisonEdge = this.da.swap_key_val(newEdge);
                this.su.cl('');
                this.su.cl("Before: ", newEdges.length);

                let edgeAlreadyAdded = false;
                _.each(newEdges, (prevAdded) => {
                  let prevAddedTarget = _.values(prevAdded)[0];
                  let prevAddedSource = _.keys(prevAdded)[0];
                  // check edge does not already exist (in whatever order
                  if ((newEdgeTarget === prevAddedTarget &&
                      newEdgeSource === prevAddedSource) ||
                    (newEdgeSource === prevAddedTarget &&
                      newEdgeTarget === prevAddedSource)
                  ) {
                    this.su.cl("alreadyAdded:", prevAdded);
                    edgeAlreadyAdded = true;
                  }
                });

                if (!edgeAlreadyAdded && !otherBranch1stLevel.includes(newEdgeTarget) &&
                  !otherBranch1stLevel.includes(newEdgeSource)) {

                  if (!rootsVisited.includes(newEdgeTarget)) {
                    nextRoots.push(newEdgeTarget);
                  }
                  newEdges.push(newEdge);

                } else {
                  this.su.cl("&&&& &&& && & this edge already been added!");
                }
                this.su.cl("After: ", newEdges.length);

              }
            }
          });
        });
        outTrees[branchName] = newEdges;
      }

    });

    return outTrees;
  }


  check_edge_ordering(edges, rootName, p) {
    if (edges.length === 1) {
      return edges;
    }
    let outEdges = [];
    let rootNames;
    let failedEdges = [];

    let edgesArenameled = false;
    if (_.keys(edges[0]).includes(p['source_key'])) {
      edgesArenameled = true;
    }
    // this.su.cl("edgesArenameled: ", edgesArenameled);
    //
    // while not all number of outedges are === to number of edges
    while (outEdges.length !== edges.length) {
      // this.su.cl("outEdges.length ", outEdges.length, " edges.length ", edges.length);
      outEdges = [];

      rootNames = [rootName];

      // if (edgesArenameled) {
      //   origBranches = _.filter( edges, [p['source_key'], currRootName] );
      // } else {
      //   origBranches = _.filter( edges, _.iteratee(currRootName) );
      // }

      // while we have more root items
      while (rootNames.length > 0) {

        let newRootNames = [];
        _.each(rootNames, (currRootName) => {

          let currEdges;
          // this.su.cl("currRootNames: ", currRootName);
          if (edgesArenameled) {
            currEdges = _.filter(edges, [p['source_key'], currRootName]);
          } else {
            currEdges = _.filter(edges, _.iteratee(currRootName));
          }
          // this.su.cl( edges );
          this.su.cl('');
          this.su.cl("currEdges: ", currEdges);

          _.each(currEdges, (currEdge) => {

            let newRootName;
            if (edgesArenameled) {
              newRootName = currEdge[p['target_key']];
            } else {
              newRootName = currEdge;
              currEdge = {};
              currEdge[currRootName] = newRootName;
            }
            outEdges.push(currEdge);

            if (!rootNames.includes(newRootName)) {
              newRootNames.push(newRootName);
            }

          });

        });
        // root names are the collection of targets from the previous
        // iteration of roots

        rootNames = newRootNames;

      }

      // find the edge whose level could not be counted
      // remove it from original array, swap it's source/target keys
      // add to edge

      failedEdges = _.difference(edges, outEdges);

      _.each(failedEdges, (failedEdge) => {
        edges = _.reject(edges, _.iteratee(failedEdge));
        if (edgesArenameled) {
          failedEdge = this.da.swap_a_pair_of_keys_vals(failedEdge);
        } else {
          failedEdge = this.da.swap_key_val(failedEdge);
        }
        edges.push(failedEdge);

      });
      this.su.cl('');
      this.su.cl("outedges: ", outEdges);
      this.su.cl('');
      this.su.cl("edges: ", edges);

    }
    //
    this.su.cl("out edges: ");
    this.su.cl(outEdges);

    return outEdges;
  }

  replace_property_values_with_neighbours(origDat, p, entryDat) {
    if (!entryDat) {
      this.su.cl("*** in!");

      entryDat = origDat;
    }

    if (_.isArray(entryDat)) {
      // each data entry, map its key as a name value and its children as an array of children
      let outEntries = [];
      _.each(entryDat, (entry) => {
        entry = this.replace_property_values_with_neighbours(origDat, p, entry);
        outEntries.push(entry);
      });
      entryDat = _.clone(outEntries);
    } else if (_.isPlainObject(entryDat)) {

      let objectMatches = true;
      if (p['specimen_matching']) {
        objectMatches = this.om.check_obj_matches(entryDat, p['specimen_matching']);
      }

      if (objectMatches) {
        // find valid reference
        let referenceSpecimenParams = p['matching_obj_source_target'];

        let possibleMatches = this.om.find_matching_nested_objs(origDat, referenceSpecimenParams['reference_matching']);
        this.su.cl("possibleMatcheS: ", possibleMatches);
        let refParams = referenceSpecimenParams['possible_ref_specimen_key_val_pairs'];
        refParams['obj_to_shake_hands_with'] = _.clone(entryDat);
        let refinedMatches = this.om.find_matching_nested_objs(possibleMatches, refParams);
        if (refinedMatches.length > 0) {
          let possibleMatch = refinedMatches[0];
          entryDat[refParams['specimen_key']] = possibleMatch[p['replace_key_reference']];
          possibleMatch[refParams['ref_key']] = entryDat[p['replace_key_reference']];
          let nP = {};
          nP['matching_key'] = refParams['ref_key'];
          nP['matching_val'] = possibleMatch[p['replace_key_reference']];
          nP['new_value'] = _.clone(entryDat[p['replace_key_reference']]);
          origDat = this.dt.swap_a_string_val_for_a_matching_str_val(data);
          let fixedDat = [];
        }
        if (refParams['check_both_directions']) {
          let reversedParams = _.clone(refParams);
          reversedParams['ref_key'] = _.clone(refParams['specimen_key']);
          reversedParams['specimen_key'] = _.clone(refParams['ref_key']);

          refinedMatches = this.om.find_matching_nested_objs(possibleMatches, reversedParams);
          if (refinedMatches.length > 0) {
            let possibleMatch = refinedMatches[0];
            entryDat[reversedParams['specimen_key']] = possibleMatch[p['replace_key_reference']];
          }
        }
      }
    }

    return entryDat;

  }




  add_nodes_compute_levels_algorithm(edges, p, rootName, leafName, groupType, containedBy, notConveying) {
    let level = 0;
    let order = 1;

    let rootNames;
    let newRootname;
    let newRootRefLyph;

    let newLeafname;
    let failedEdges = [];

    let outLyphs = [];
    let outNodes = [];
    let outEdges = [];

    let extraEdge = {};
    extraEdge[p['source_key']] = leafName;
    extraEdge[p['target_key']] = p['orphan_lyph_string'];

    edges.push(extraEdge);
    //
    console.log("edges: ", edges);
    // console.log("rootName: ", rootName);
    // console.log("leafName: ", leafName);
    //

    rootNames = [rootName];

    // while we have more root items
    let lastTarget = "";
    let lastTargetID = "";

    while (rootNames.length > 0) {
      level++;

      let newRootNames = [];
      _.each(rootNames, (currRootName) => {

        let currEdges;

        currEdges = _.filter(edges, [p['source_key'], currRootName]);

        let z = 0;
        _.each(currEdges, (currEdge) => {
          currEdge['group_type'] = groupType;
          currEdge['contained_by'] = containedBy;

          if (!outLyphs.includes(currEdge[p['source_key']])) {
            outLyphs.push(currEdge[p['source_key']])
          }
          if (!outLyphs.includes(currEdge[p['target_key']]) &&
            (currEdge[p['target_key']] !== p['orphan_lyph_string'])) {
            outLyphs.push(currEdge[p['target_key']])
          }

          let newRootName;

          currEdge[p['distance_key']] = level;
          newRootName = currEdge[p['target_key']];

          let newEdgeLabel;
          let useTargetname = false;
          this.su.cl('');
          // this.su.cl("currEdge: ", currEdge);
          let idArray = _.concat( p['edges_name_prefaces'], level, " -- ", currEdge[p['source_key']], " -- ", currEdge[p['target_key']] )
          currEdge[p['edges_id_key']] = _.join(idArray, "");

          if (p['edges_label_diff_of_source_target']) {

            newEdgeLabel = this.su.get_str_as_diff_between_words_from_both_arrays( currEdge[p['source_key']], currEdge[p['target_key']] )

            // if (p['edges_name_prefaces']) {
            //   let edges_name_prefacesParams = _.clone(p['edges_name_prefaces']);
            //   edges_name_prefacesParams.push(level);
            //   let edgenamePrefix = this.da.join_strs_key_dependent(edges_name_prefacesParams, currEdge);
            //   // newEdgeLabel = edgenamePrefix + " - " + newEdgeLabel;
            // }

            if (p['edges_name_suffix']) {
              newEdgeLabel += p['edges_name_suffix'];
            }

          }
          currEdge[p['edges_unique_name_key']] = newEdgeLabel;

          // is this ??
          // currEdge[p['edges_ref_key']] = currEdge[p['target_key']];
          console.log("currEdge[p['source_key']]: ", currEdge[p['source_key']]);
          console.log("not conveyedLyph: ", notConveying);

          if (p['edges_ref_from_source']) {
            if (!notConveying.includes(currEdge[p['source_key']])){
              currEdge['conveyingLyph'] = currEdge[p['source_key']];
            } else {
              console.log("this lyph is not a conveying lyph");
            }
          } else {
            if (!notConveying.includes(currEdge[p['target_key']])){
              currEdge['conveyingLyph'] = currEdge[p['target_key']];
            } else {
              console.log("this lyph is not a conveying lyph");

            }
          }

          //
          // this.su.cl("in!", currEdge);


          // believe this is where the selection of conveying lyph occurs.
          // if (leafName !== currEdge[p['target_key']]) {
          //   currEdge[p['edges_ref_key']] = currEdge[p[p['edges_ref_source']]];
          // } else {
          //   currEdge[p['edges_ref_key']] = currEdge[p['target_key']];
          // }
          if (p['edges_mark_type']) {
            let markTypeDict = p['edges_mark_type'];
            currEdge[markTypeDict['mark_type_key']] = markTypeDict['mark_type_value'];
          }

          if (p['nodes_key']) {
            let possibleNodes = [currEdge[p['source_key']], currEdge[p['target_key']]];

            let currnamePrefacesParams = [];
            let nodeLyphRef;
            let nodeRefKey;
            _.each(possibleNodes, (possibleNode) => {
              if (possibleNode) {
                // first generate node name
                // this.su.cl("currnamePrefacesParams: ", currnamePrefacesParams);
                let nConnectedEdges;
                if (possibleNode === p['orphan_lyph_string']) {
                  if (p['leaf_name_prefaces']) {
                    currnamePrefacesParams = _.clone(p['leaf_name_prefaces']);
                  }
                  nConnectedEdges = 1;

                } else if (possibleNode === rootName) {
                  if (p['root_name_prefaces']) {
                    currnamePrefacesParams = _.clone(p['root_name_prefaces']);
                  }

                  if (p['root_ref_key']) {
                    newRootRefLyph = currEdge[p['source_key']];
                  }
                  nConnectedEdges = 1;

                } else {
                  if (p['node_name_prefaces']) {
                    currnamePrefacesParams = _.clone(p['node_name_prefaces']);
                  }
                  nConnectedEdges = 2;
                  useTargetname = true;
                }

                if (!currnamePrefacesParams.includes(order)) {
                  currnamePrefacesParams.push(order);
                }

                let namePrefix = _.join(currnamePrefacesParams, "");
                let nodeID;


                let nodename;
                let nodeEdgeKey;

                nodeLyphRef = _.clone(possibleNode);
                // console.log(possibleNode, " : ", z);

                if (possibleNodes[0] === possibleNode) {
                  console.log(possibleNode, " : ", z);

                  if (useTargetname && lastTarget) {
                    nodeID = lastTargetID;
                    nodename = lastTarget;
                    // this.su.cl("using the prior last targetname: ", lastTarget);

                  } else {
                    let nodeIDarr = _.concat(namePrefix, " -- ", possibleNodes[0], " -- ", possibleNodes[1]);
                    nodeID = _.join(nodeIDarr, "");

                    let sourceMatch = this.su.get_str_as_diff_between_words_from_first_array(possibleNodes[0], possibleNodes[1]);
                    nodename = namePrefix + " - " + sourceMatch;
                    nodename = sourceMatch;

                    if (p['node_name_suffix']) {
                      nodename += p['node_name_suffix']
                    }
                  }

                  currEdge[p['source_key']] = nodeID;
                  nodeEdgeKey = p['target_key'];

                } else {

                  let targetMatch = this.su.get_str_as_diff_between_words_from_first_array(possibleNodes[1], possibleNodes[0]);
                  // nodename = this.su.get_common_words_in(, targetMatch);
                  nodename = namePrefix + " - " + targetMatch;
                  nodename = targetMatch;

                  let nodeIDarr = _.concat(namePrefix, " -- ", possibleNodes[1], " -- ", possibleNodes[0]);
                  nodeID = _.join(nodeIDarr, "");

                  if (p['node_name_suffix']) {
                    nodename += p['node_name_suffix']
                  }

                  nodeEdgeKey = p['source_key'];
                  currEdge[p['target_key']] = nodeID;
                  lastTargetID = nodeID;
                  lastTarget = nodename;

                  this.su.cl("lastTarget: ", lastTarget);

                }

                // this.su.cl("new node name: ", nodename);

                if (possibleNode === p['orphan_lyph_string']) {
                  newLeafname = nodeID;
                  nodeRefKey = "terminal" + p['node_ref_lyph_key_appendix'];
                } else if (possibleNode === rootName) {
                  newRootname = nodeID;
                  nodeRefKey = "root" + p['node_ref_lyph_key_appendix'];
                } else {
                  nodeRefKey = nodeEdgeKey + p['node_ref_lyph_key_appendix'];
                }

                // If node not already added
                let nodeAlreadyExists = _.find(outNodes, [p['nodes_name_key'], nodename]);

                // let nEdgesFromNodeAlreadyAdded = _.find(outNodes, [p['nodes_edge_key'], newEdgename]);
                // if (!nEdgesFromNodeAlreadyAdded || nEdgesFromNodeAlreadyAdded.length < nConnectedEdges) {
                // a node can have another edge

                if (!nodeAlreadyExists) {
                  // there is no node attached to this edge --- add!
                  let newNode = {};
                  newNode[p['nodes_number_key']] = order;
                  newNode[p['nodes_name_key']] = nodename;
                  newNode[p['nodes_id_key']] = nodeID;
                  newNode['group_type'] = groupType;
                  newNode['contained_by'] = containedBy;

                  newNode[nodeRefKey] = possibleNodes[0];;

                  if (p['node_mark_type']) {
                    let markTypeDict = p['node_mark_type'];
                    newNode[markTypeDict['mark_type_key']] = markTypeDict['mark_type_value'];
                  }
                  newNode[nodeEdgeKey] = currEdge[p['edges_id_key']];
                  outNodes.push(newNode);
                  order += 1;
                } else {
                  let tempNodes = [];
                  _.each(outNodes, (outNode) => {
                    if (outNode[p['nodes_name_key']] === nodename) {
                      outNode[nodeRefKey] = possibleNodes[0];
                      outNode[nodeEdgeKey] = currEdge[p['edges_id_key']];
                    }
                    outNode['group_type'] = groupType;
                    outNode['contained_by'] = containedBy;
                    tempNodes.push(outNode);
                  });
                  outNodes = tempNodes;
                }
              }

            });
          }

          outEdges.push(currEdge);

          if (!rootNames.includes(newRootName)) {
            newRootNames.push(newRootName);
          }
        });
      });
      // root names are the collection of targets from the previous
      // iteration of roots

      rootNames = newRootNames;
    }
    // this.su.cl("out edges: ");
    // this.su.cl(outEdges);

    return [outLyphs, outEdges, outNodes, newRootname, newLeafname, newRootRefLyph];
  }


  merge_trees(newTree, tree1, tree2, p, newEdgeRefLyph) {

    // add new link
    // if (p['new_edge_originating_node_key']){
    //
    // }

    let newLink = {};

    if (p['new_edge_originating_node_key'] === "root") {

      newLink[p['source_key']] = tree1[p['new_edge_originating_node_key']];
      newLink[p['target_key']] = tree2[p['new_edge_originating_node_key']];

    } else {

      newLink[p['target_key']] = tree1[p['new_edge_originating_node_key']];
      newLink[p['source_key']] = tree2[p['new_edge_originating_node_key']];

    }

    let newNameArr = _.concat(newLink[p['source_key']], newLink[p['target_key']]);

    newLink[p['new_edge_name_key']] = _.join(newNameArr, " --- ");
    newLink[p['new_edge_label_key']] = this.su.get_str_as_diff_between_words_from_both_arrays(newLink[p['source_key']], newLink[p['target_key']]);


    if (p['new_edge_originating_node_key'] === "root") {
      p['update_node_key'] = p["source_key"];
    } else {
      p['update_node_key'] = p["target_key"];
    }

    newLink[p['new_edge_level_key']] = p['new_edge_level_key_starting'];
    newLink[p['edges_ref_key']] = newEdgeRefLyph;

    newLink["type"] = "link";

    // this.su.cl("newLink: ", newLink);

    let objMatchingParams = {};
    objMatchingParams["func"] = "check_obj_contains_either_of_these_key_value_pairs";
    // construct matching params
    let keyValPairToMatch = {};
    keyValPairToMatch[p['node_match_by']] = tree1[p['new_edge_originating_node_key']];
    objMatchingParams['key_value_pairs'] = [keyValPairToMatch];

    // nodes update
    let matchBy = tree1[p['new_edge_originating_node_key']];
    tree1[p['nodes_arr_key']] = this.dt.update_matching_object(tree1[p['nodes_arr_key']], objMatchingParams, p['update_node_key'], newLink[p['new_edge_name_key']]);


    // links update
    keyValPairToMatch[p['node_match_by']] = tree2[p['new_edge_originating_node_key']];
    objMatchingParams['key_value_pairs'] = [keyValPairToMatch];
    tree2[p['nodes_arr_key']] = this.dt.update_matching_object(tree2[p['nodes_arr_key']], objMatchingParams, p['update_node_key'], newLink[p['new_edge_name_key']]);

    //
    keyValPairToMatch = {};
    // console.log("newEdgeRefLyph: ", newEdgeRefLyph);
    // throw new Error();
    keyValPairToMatch["conveyingLyph"] = newEdgeRefLyph;
    objMatchingParams['key_value_pairs'] = [keyValPairToMatch];
    tree2[p['edges_arr_key']] = this.dt.update_matching_object(tree2[p['edges_arr_key']], objMatchingParams, "conveyingLyph", "");
    tree1[p['edges_arr_key']] = this.dt.update_matching_object(tree1[p['edges_arr_key']], objMatchingParams, "conveyingLyph", "");


    // console.log("tree1 ", tree1.name)
    // this.da.print_keys(tree1);
    // console.log('');
    // console.log("tree2 ", tree2.name);

    newTree = this.da.merge_with_internal_arrays_concatenated(tree1, tree2);
    newTree[p['edges_arr_key']].push(newLink);

    //
    //
    // // let tree1_nodeToModify;
    // // let tree1_nodeToModify;
    // //
    // newTree[p['nodes_arr_key']] = _.concat(tree1[p['nodes_arr_key']], tree2[p['nodes_arr_key']]);

    return newTree;
  }



  join_trees_that_share_root_ref_lyphs(treeDat, p) {

    let outTrees = [];

    p['only_vals'] = true;
    p['as_single_array'] = true;
    let uniqueRootRefLyphs = _.uniq(this.ds.select_subset_of_keys_from_arr(treeDat, p));
    let pForNames = _.clone(p);
    pForNames['keys_to_select'] = ['name'];
    let treeNames = _.uniq(this.ds.select_subset_of_keys_from_arr(treeDat, pForNames));

    // this.su.cl(treeDat);
    // console.log("p: ", p);
    // console.log("uniqueRootRefLyphs: ", uniqueRootRefLyphs);
    // console.log("NAMES OF TREES: ", treeNames);

    let nvP = p['name_val_params'];

    _.each(uniqueRootRefLyphs, (rootRefLyph) => {
      let newTree = {};
      let treesToConnect = _.filter(treeDat, [p['keys_to_select'], rootRefLyph]);


      if (treesToConnect.length > 1) {
        _.each(treesToConnect, (treeToConnect) => {
          // name new tree
          if (!newTree[nvP['name_key']]) {
            newTree[nvP['name_key']] = treeToConnect[nvP['name_key']];
          } else {
            newTree[nvP['name_key']] = this.su.get_common_words_in(newTree[nvP['name_key']], treeToConnect[nvP['name_key']]);
          }

          // merge ids
          if (!newTree[p['id_key']]) {
            newTree[p['id_key']] = treeToConnect[p['id_key']];
          } else {
            newTree[p['id_key']] = _.join([newTree[p['id_key']], treeToConnect[p['id_key']]], "_");
          }

          // add leaves / roots
          if (!newTree[p['root_key']]) {
            if (treeToConnect[p['root_key']]) {
              newTree[p['root_key']] = [treeToConnect[p['root_key']]];
            }
          } else {
            if (treeToConnect[p['root_key']]) {
              newTree[p['root_key']] = _.uniq(_.concat(newTree[p['root_key']], treeToConnect[p['root_key']]));
              // newTree[p['root_key']].push(treeToConnect[p['root_key']])
            }
          }

          if (!newTree[p['leaf_key']]) {
            if (treeToConnect[p['leaf_key']]) {
              newTree[p['leaf_key']] = [treeToConnect[p['leaf_key']]];
            }
          } else {
            if (treeToConnect[p['leaf_key']]) {
              newTree[p['leaf_key']] = _.uniq(_.concat(newTree[p['leaf_key']], treeToConnect[p['leaf_key']]));
            }
          }
        });
      }
      // console.log("TREE  ---   1   ---");
      // console.log(treesToConnect[0].name);
      // this.da.print_keys(treesToConnect[0]);
      // console.log("TREE  ---   2   ---");
      // console.log(treesToConnect[1].name);
      // this.da.print_keys(treesToConnect[1]);

      newTree = this.merge_trees(newTree, treesToConnect[0], treesToConnect[1], p, rootRefLyph);

      newTree[nvP['name_key']] = newTree[nvP['name_key']].replace(nvP['remove_words'], "");
      newTree[nvP['name_key']] += nvP['suffix'];
      // console.log('');
      // console.log("T R E E   -- new");
      // console.log(newTree.name);
      // this.da.print_keys(newTree);

      outTrees.push(newTree);
    });

    return outTrees;
  }




  add_nodes_compute_levels(referenceDat, treeDat, p) {
    // this.su.cl('modifiedDat in: ');
    // this.su.cl('modifiedDat in: ');
    // set reference dat

    // this.su.cl('refDat in: ');
    // this.da.print_keys( referenceDat );
    // this.su.cl('treeDat in: ');
    // this.da.print_keys( treeDat );
    let outTrees = [];
    let notConveyed = [];

    // only allows single root and single leaf in tree for now

    _.each(treeDat, (tree) => {
      let rootName;
      let leafName;
      let sources = [];
      let targets = [];
      this.su.cl(tree);
      // console.log("tree[p['edges_key']]: ", _.keys(tree));

      _.each(tree[p['edges_key']], (edge) => {
        let refMatch = _.find(referenceDat, [p['reference_id_key'], edge[p['source_key']]]);
        if (!tree['group_type'] && refMatch['group_type']) {
          tree['group_type'] = refMatch['group_type'];
        }
        if (!tree['contained_by'] && refMatch['contained_by']) {
          tree['contained_by'] = refMatch['contained_by'];
        }
        if (refMatch[p['root_flag_key']]) {
          rootName = edge[p['source_key']];
        }
        if (refMatch[p['leaf_flag_key']]) {
          leafName = edge[p['source_key']];
        }

        if (refMatch['invisible']){
          notConveyed.push(edge[p['source_key']]);
        }

        refMatch = _.find(referenceDat, [p['reference_id_key'], edge[p['target_key']]]);
        // console.log(p);
        // console.log("edge: ", edge);
        // this.su.cl( refMatch );
        if (refMatch[p['root_flag_key']]) {
          rootName = edge[p['target_key']];
          console.log("temp root name: ", rootName);
        }
        if (refMatch[p['leaf_flag_key']]) {
          leafName = edge[p['target_key']];
        }

        if (refMatch['invisible']){
          notConveyed.push(edge[p['target_key']]);
        }
        console.log("edge: ", edge);


        //
        if (!rootName) {
          sources.push(edge[p['source_key']]);
          targets.push(edge[p['target_key']]);
        }

      });

      console.log("notConveyed: ", notConveyed);

      // assign root if no root

      if (!rootName) {
        let items = _.concat(sources, targets);
        // look for first source key that does not appear anywhere else in the array
        _.each(sources, (sourceKey, i) => {
          // let compArr = _.remove(sourceKeys, sourceKey);
          let existsFurtherUpArray = _.lastIndexOf(items, sourceKey);
          // console.log("i: ", i, " ", sourceKey, '_.lastIndex(sourceKeys, sourceKey): ', existsFurtherUpArray);
          if (existsFurtherUpArray === i) {
            rootName = sourceKey;
            return false;
          }
        });
      }

      // assign leaf if no leaf

      if (!leafName) {
        let items = _.concat(targets, sources);
        // look for first source key that does not appear anywhere else in the array
        _.each(targets, (targetKey, i) => {
          // let compArr = _.remove(sourceKeys, sourceKey);
          let existsFurtherUpArray = _.lastIndexOf(items, targetKey);
          // console.log("i: ", i, " ", sourceKey, '_.lastIndex(sourceKeys, sourceKey): ', existsFurtherUpArray);
          if (existsFurtherUpArray === i) {
            leafName = targetKey;
            return false;
          }
        });
      }
      console.log("rootName: ", rootName);

      tree[p['root_key']] = rootName;
      if (leafName) {
        tree[p['leaf_key']] = leafName;
      }


      tree[p['edges_key']] = _.cloneDeep(this.ensure_root_is_source(tree[p['edges_key']], rootName, p));

      this.su.cl("tree PRIOR to name_levels");
      this.su.cl(tree);
      let groupType = tree['group_type'];
      let containedBy = tree['contained_by'];

      //
      let [outLyphs, outEdges, outNodes, newRootName, newLeafName, newRootRefLyph] = this.add_nodes_compute_levels_algorithm(tree[p['edges_key']], p, rootName, leafName, groupType, containedBy, notConveyed);

      tree[p['root_key']] = newRootName;
      tree[p['leaf_key']] = newLeafName;


      tree[p['edges_key']] = outEdges;
      tree[p['nodes_key']] = outNodes;
      tree["lyphs"] = outLyphs;

      if (newRootRefLyph) {
        tree[p['root_ref_key']] = newRootRefLyph;
      }
      // this.su.cl("");
      // this.su.cl("tree POST to name_levels");
      //
      this.su.cl(tree);
      //


      outTrees.push(tree);
    });

    return outTrees;
  }

  map_nodes_to_host_lyphs(nodeDat, lyphDat, p, firstGo) {
    if (!firstGo) {
      console.log("lyphDat: ");
      this.da.print_keys(lyphDat);
      console.log("");
      console.log("nodeDat");
      this.da.print_keys(nodeDat);
      firstGo = true;
    } else {
      firstGo = false;
    }
    let outLyphDat = [];

    let matchingParams = p['scrutinised_obj'];
    _.each(lyphDat, (lyphObj) => {
      _.each(nodeDat, (nodeEntry) => {

        _.each(matchingParams, (matchingP) => {
          // console.log("matchingP: ", matchingP)
          let idToCompare;
          let nodeLyphID = nodeEntry[matchingP['reference_id_key']];
          if (matchingP['specimen_id_key_from_sub_key']) {
            let lyphFromSubkey = _.find(lyphDat, [matchingP['specimen_id_key'], nodeLyphID]);
            if (lyphFromSubkey) {
              idToCompare = lyphFromSubkey[matchingP['specimen_id_key_from_sub_key']];
            } else {
              idToCompare = "";
            }
          } else {
            idToCompare = nodeLyphID;
          }

          let lyphID = lyphObj[matchingP['specimen_id_key']];

          // this.su.cl("matchingP: ", matchingP);
          // console.log("lyphID: ", lyphID, " idToCompare:", idToCompare)
          if (lyphID === idToCompare) {
            // console.log("MATCH ", lyphID);
            let newValStr = [nodeEntry[matchingP['specimen_val_key']]];

            if (matchingP['new_val_obj']) {
              let newValObj = _.clone(matchingP['new_val_obj']);
              let tempP = {};

              tempP['old_val'] = matchingP['new_val_match_str'];
              tempP['new_val'] = newValStr;

              newValObj = this.dt.map_values_to_values_nested(newValObj, tempP);

              newValStr = _.clone(newValObj);

              // this.su.cl("NEW VAL STR: ", JSON.stringify(newValStr));
            }

            if (lyphObj[matchingP['new_key']]) {
              lyphObj[matchingP['new_key']] = this.da.merge_internal_arrays_of_equivalent_data_hierarchy(lyphObj[p['new_key']], newValStr);
            } else {
              lyphObj[matchingP['new_key']] = _.clone(newValStr);
            }

          }

        });

      });
      outLyphDat.push(lyphObj);

    });
    if (firstGo) {
      console.log("matchingP: ", p);
      // this.su.cl("outLyphDat: ", outLyphDat);

    }
    return outLyphDat;
  }
}
