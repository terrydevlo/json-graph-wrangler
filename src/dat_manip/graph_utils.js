// Handles graph inference

import 'lodash';
import DataIO from './data_io.js';
import StringUtils from './string_utils.js';
import DictArrUtils from "./dict_array_utils.js";
import DataSelect from "./data_select.js";
import DataTrans from "./data_trans.js";

export default class GraphUtils {

  constructor() {

    // console.log(this);
    this.da = new DictArrUtils();
    this.ds = new DataSelect();
    this.dt = new DataTrans();
    this.su = new StringUtils();

  }

  graph_obj_properties_to_graphs_referring_to_id( inDat, p ){

    let outGraphs = [];
    let keys = this.da.get_all_keys(inDat);

    let idItems = _.uniq(this.da.get_arr_of_vals_from_arr_dict_by_key(inDat, p['idKey']));
    // For each key
    _.each(keys, (key) => { // Each property has the potential to be graphable
      if (key !== p['idKey'] ){ // Cannot map a graph to itself
        p['KOI'] = _.clone(key);
        let objsOI = _.clone(this.da.subset_arr_of_objs( inDat, [p['KOI'], p['idKey']] ));

        let uniqueItems = _.uniq( this.da.get_arr_of_vals_from_arr_dict_by_key( objsOI, key )); // items to
        let outGraph;
        let edgesGraph;

        if (uniqueItems.length > 0){ // need some items to graph
          // console.log(objsOI.slice(0,5));
          // console.log(key, " ", uniqueItems[0], " ", typeof(uniqueItems[0]));
          if (idItems.includes(uniqueItems[0])){ // if we are mapping like objects, we have a hierarchy ...
            objsOI = _.clone(this.da.subset_arr_of_objs( _.clone(inDat), [p['KOI'], p['idKey']], true));
            outGraph = _.clone(this.graph_hierarchy( objsOI, p ));
          }
           else if (_.isArray(uniqueItems[0])){ // arrays have reverse mapping -- id to pOI
            outGraph = this.graph_id_to_val_arrays( objsOI, p );
          } else {
          }


          if (outGraph){
            if (p['create_edges']){
              edgesGraph = this.create_edges(outGraph);
              // console.log("edgesGraph: ", edgesGraph);
            }
            let tempP={};
            tempP['new_key'] = "name";
            tempP['new_value_key'] = "children";
            outGraph = this.dt.map_keys_to_values(_.clone(outGraph), tempP);

            let graphRoot = {}  // create graph root
            graphRoot['name'] = p['KOI'];
            graphRoot['children'] = outGraph;

            let outObj = {};
            outObj['filename'] = key + ".json";
            outObj['data'] = _.clone(graphRoot);
            outGraphs.push(outObj);
          }

          if (edgesGraph){
            // console.log("adding");
            let newEdgesObj = {};
            newEdgesObj['filename'] = "edges/edges_" + key + ".json";
            newEdgesObj['data'] = _.clone(edgesGraph);
            outGraphs.push(newEdgesObj);
          }
        }
      }

    });
    this.su.cl(outGraphs);
    // console.log("outGraphs: ", JSON.stringify(outGraphs));

    return outGraphs;
  }

  // iterates through a nested obj where keys represent a key and values represents
  // targets. Converts to flat source target.
  create_edges(inDat, p){
    let outDat = [];

    if (_.isArray(inDat)) {
      // each data entry, map its key as a name value and its children as an array of children
      _.each(inDat, (entry) => {
        let newEdges = this.create_edges(entry, p);
        if (!_.isEmpty(newEdges)){
          outDat = _.concat(outDat, newEdges);
        }
      });
    } else if (_.isPlainObject(inDat)) {
      _.forOwn(inDat, (v, k) => {


        if (_.isArray(v)){
          _.each(v, (item) => {
            let newObj = {};
            newObj["source"] = _.clone(k);
            newObj["target"] = _.keys(item)[0];

            outDat = _.concat(outDat, newObj);

            // console.log(outDat);
            let itemVal = _.values(item)[0];
            if (!_.isEmpty(itemVal)){
              let moreEdges = this.create_edges(itemVal, p);
              // console.log("moreEdges: ", moreEdges);
              outDat = _.concat(outDat, moreEdges);
            }
          });
        } else if (_.isPlainObject(v) && !_.isEmpty(v)){
          let newObj = {};
          newObj["source"] = _.clone(k);
          let vKey = _.keys(v)[0];
          newObj["target"] = _.clone(itemVal);
          outDat.push(newObj);
          if (!_.isEmpty(itemVal)){
            let moreEdges = this.create_edges(itemVal, p);
            outDat = _.concat(outDat, moreEdges);
          }
        }
      });
    }
    return outDat;
  }


  graph_uniques_to_children(inDat, p) {
    console.log("in graph_uniques_to_children");

    // console.log("inDAT", inDat);
    let outGraph = [];

    _.each(p['uniques'], (item) => {
      let children = _.filter(inDat, [p['KOI'], item]);

      let childrenObjs = {};
      childrenObjs['name'] = item;
      childrenObjs['children'] = [];

      _.each(children, (child) => {
        let childObj = {};
        childObj['name'] = child[p['idKey']];
        childrenObjs['children'].push(childObj);
      });


      if (childrenObjs['children'].length > 0){
        outGraph.push(childrenObjs);
      }

    });
    // console.log("outgraph local: ", outGraph);
    return outGraph;
  }


  make_connectivity_matrix_to_source_target_graph(inDat, p){
    console.log("indat: ", inDat);
    return inDat;
  }


  graph_id_to_val_arrays(inDat, p) {
    console.log("in graph_id_to_val_arrays");

    // console.log("inDAT", inDat);
    let outGraph = [];

    _.each(inDat, (item) => {

      // let childrenObjs = {};
      // childrenObjs['name'] = item[p['idKey']];
      // childrenObjs['children'] = [];
      //
      // _.each(item[p['KOI']], (child) => {
      //   let childObj = {};
      //   childObj['name'] = child;
      //
      //   childrenObjs['children'].push(childObj);
      // });
      //
      // if (childrenObjs['children'].length > 0){
      //   outGraph.push(childrenObjs);
      // }
      let childrenObjs = {};
      childrenObjs[item[p['idKey']]] = [];

      _.each(item[p['KOI']], (child) => {
        let childObj = {};
        childObj[child] = {};
        childrenObjs[item[p['idKey']]].push(childObj);
      });

      if (childrenObjs[item[p['idKey']]].length > 0){
        outGraph.push(childrenObjs);
      }
    });
    return outGraph;
  }


  remove_duplicate_edges( edges, p ) {
    console.log("edges: ", edges, p);
    let already_checked = (thisEdge, thatEdge) => {
      console.log("thisEdge: ", thisEdge);
      console.log("thatEdge: ", thatEdge);
    }
    let outEdges = [];

    _.each(edges, (edge) => {
      let edgeVals = _.values(edge);
      let edgeAlreadyPresent = false;
      _.each(outEdges, (edgeChecked) => {
        let edgeCheckedVals = _.values(edgeChecked);
        if (edgeCheckedVals.length > 0){
          let allMatch = true;
          _.each(edgeVals, (edgeVal) => {
            if (!edgeCheckedVals.includes( edgeVal )){
              allMatch = false;
              return false;
            }
          });
          // console.log("allMatch: ", allMatch, "edgeCheckedVals: ", edgeCheckedVals, " edgeVals: ", edgeVals);

          if (allMatch){
            edgeAlreadyPresent = true;
          }
        }
      });
      if (!edgeAlreadyPresent || outEdges.length === 0 ){
        console.log("edgeAlreadyPresent: ", edgeAlreadyPresent);

        outEdges.push(edge);
      }
    });
    console.log("outEdges: ", outEdges);
    return outEdges;
  }



  graph_hierarchy(inDat, p) {
    console.log("in graph_hierarchy: ", p);
    // console.log("inDAT", inDat);
    let outGraph = [];
    let parentsTraversed = [];

    let highestOrderParent = this.get_highest_parent_level(parentsTraversed, inDat, p['KOI'], p['idKey']);

    while (highestOrderParent) {

      parentsTraversed.push(highestOrderParent);
      console.log("ptrav: ", parentsTraversed);
      // console.log(" highestOrderParent: ", highestOrderParent);
      let children = _.filter(inDat, [p['KOI'], highestOrderParent]);
      let minimalChildren = [];
      let insertedVals = [];
      let nConnections = 0;

      _.each(children, (child) => {

        let newVal = child[p['idKey']];

        if (newVal !== "") {
          let outObj = {};
          outObj[newVal] = {};

          let alreadyIn = false;
          _.each(minimalChildren, (minimalChild) => {
            // console.log("mc: ", minimalChild, " outObj: ", outObj);
            if (_.values(minimalChild)[0] === newVal) {
              alreadyIn = true;
            } else {
              // console.log(" minimalChild: ", minimalChild);
            }
          });

          if (!alreadyIn) {
            minimalChildren.push(outObj);
          }
        }

      });

      if (minimalChildren.length > 0) {
        let tempGraphHierarchy = this.get_hierarchical_order(inDat, p['KOI'], p['idKey'], highestOrderParent);
        // console.log("tempGraphHierarchy: ", tempGraphHierarchy);
        tempGraphHierarchy.push(highestOrderParent);
        let tempGraph = this.build_obj_from_hierarchy(tempGraphHierarchy, minimalChildren);

        outGraph = this.da.merge_internal_arrays_of_equivalent_data_hierarchy(outGraph, tempGraph);

      }

      highestOrderParent = this.get_highest_parent_level(parentsTraversed, inDat, p['KOI'], p['idKey']);
    }

    return outGraph;
  }


  build_obj_from_hierarchy(hierarchy, values) {
    let newObj = {};
    let nextKey = hierarchy.shift();

    if (hierarchy.length > 0) {
      // console.log("hierarchy: ", hierarchy);
      newObj[nextKey] = this.build_obj_from_hierarchy(hierarchy, values);

    } else {
      newObj[nextKey] = values;
    }

    if (_.isEmpty(newObj)) {
      newObj = [];
    }
    return newObj;
  }


  get_hierarchical_order(inDat, parentKey, p, currHighestOrder) {
    let outHierarchy = [];
    let inEntry = _.find(inDat, [p['idKey'], currHighestOrder]);
    // console.log("inEntry: ", inEntry);
    if (inEntry) {
      if (inEntry[p['idKey']] !== '') {
        outHierarchy.unshift(inEntry[p['idKey']]);
      }
      if (inEntry[parentKey] !== '') {
        outHierarchy.unshift(this.get_hierarchical_order(inDat, parentKey, p['idKey'], inEntry[parentKey]));
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

        // console.log('Input CHILDREN: ', children.length);
        //
        // _.each(children, (ent) => {
        //   let treeKeys = _.keys(tree);
        //   p['keys_to_select'] = keysToSelectP;
        //   console.log(this.ds.select_subset_of_keys_from_arr([ent], p));
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
              // console.log("newVals: ", newVals);
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
                  // console.log(" ##$!%# this entry is already present! ");
                } else {
                  minimalChildren.push(newConnection);
                }
              }
            });
          }

          // then populate previous > this
          if (child[p['source_key']] && child[p['source_key']] !== "") {
            // console.log("child: ", child);
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
                  // console.log(" ##$!%# this entry is already present! ");
                } else {
                  minimalChildren.push(newConnection);
                }
              }
            });
          }
        });

        // console.log("minimalChildren length: ", minimalChildren);
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
    // console.log(this.select_subset_of_keys_from_arr(arrToAudit, keysToSelectP));

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
          // console.log( this.select_subset_of_keys_from_arr( [prevMatch], keysToSelectP ) );
        });
      } else {

      }
      cleanedEntries.push(entry);

    });

    // this.su.print_blank_lines(3, "*after* AUDIT");
    // console.log(this.select_subset_of_keys_from_arr(arrToAudit, keysToSelectP));
    return cleanedEntries;
  }

  enforce_connected_order_from_seq_arr(arrPrevToNext, p) {
    let outOrder = [];

    let compPrevs = _.cloneDeep(_.initial(arrPrevToNext));
    compPrevs.unshift(undefined);

    let compNexts = _.cloneDeep(_.tail(arrPrevToNext));
    compNexts.push(undefined);
    let keysToSelectP = _.concat([], p['id_key'], p['source_key'], p['target_key']);

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
    // console.log(this.select_subset_of_keys_from_arr(arrPrevToNext, keysToSelectP));
    return outOrder;
  }

  insert_tree_pattern_between_connected(connectedPair, p) {
    let keysToSelectP = _.concat([], p['id_key'], p['source_key'], p['target_key'], p['comparator_key']);

    let newLyphs = [];
    let cleanedConnectedPair = [];
    console.log('');
    console.log("== Inserting tree pattern.")
    // make sure there are no duplicated pairs
    let pairNames = [];
    _.each(connectedPair, (entry) => {
      pairNames.push(entry[p['id_key']]);
      // console.log('');
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
    console.log("pairNames: ");
    console.log(pairNames);
    //

    // this.su.print_blank_lines(3, "unclean");
    // console.log( this.select_subset_of_keys_from_arr( connectedPair, keysToSelectP ) );
    //
    // this.su.print_blank_lines(3, "clean");
    // console.log( this.select_subset_of_keys_from_arr( cleanedConnectedPair, keysToSelectP ) );
    //
    let templateLyph = _.cloneDeep(cleanedConnectedPair[0]);
    let previousLyph = templateLyph;
    let newLyphNames = [];

    _.each(p['new_types'], (newType) => {

      let newLyph = _.cloneDeep(templateLyph);
      // console.log('')
      // console.log( this.select_subset_of_keys_from_arr( [newLyph], keysToSelectP ) );

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
    // console.log("PRIOR ENFOCEMENT");
    // console.log(this.select_subset_of_keys_from_arr(newLyphs, keysToSelectP));
    // this.su.print_blank_lines(5);

    newLyphs = this.enforce_connected_order_from_seq_arr(newLyphs, p);
    newLyphs = this.audit_connected_order(newLyphs, p);

    // //
    // this.su.print_blank_lines(5);
    // console.log("post");
    // console.log(this.select_subset_of_keys_from_arr(newLyphs, keysToSelectP));

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
          // console.log(entry[p['target_key']], " ", entry[p['source_key']]);

          _.each(entry[p['target_key']], (nextEntry) => {
            if (nextEntry !== '' && nextEntry !== null) {
              let nextConnected = _.find(possibleIllegals, [p['id_key'], nextEntry]);
              // check there is a next connected and that is not the same as the p['idKey']
              if (nextConnected && nextConnected[p['id_key']] !== entry[p['id_key']]) {
                // console.log("NEXT: ", entry[p['target_key']], nextConnected[p['id_key']]);

                connectedPairs.push([entry, nextConnected]);
              }
            }
          });

          _.each(entry[p['source_key']], (previousEntry) => {
            if (previousEntry !== '' && previousEntry !== null) {
              if (entry[p['source_key']] !== '' && entry[p['source_key']] !== null) {
                let previousConnected = _.find(possibleIllegals, [p['id_key'], previousEntry]);
                if (previousConnected && previousConnected[p['id_key']] !== entry[p['id_key']]) {
                  // console.log("PREV: ", entry[p['source_key']], previousConnected[p['id_key']]);

                  connectedPairs.push([previousConnected, entry]);
                }
              }
            }
          });
          // this.su.print_blank_lines(5);

          if (connectedPairs.length > 0) {
            // console.log('');
            // console.log("CPsssss: ", this.ds.select_subset_of_keys_from_arr(connectedPairs, keysToSelectP));
            // this.su.print_blank_lines(3, "before AUDIT");
            // _.each(origDat, (ent) => {
            //   console.log( this.ds.select_subset_of_keys_from_arr( ent, keysToSelectP ) );

            _.each(connectedPairs, (connectedPair) => {
              // console.log('');
              // console.log("CPsssss: ", this.ds.select_subset_of_keys_from_arr(connectedPair, keysToSelectP));

              sourceEntry = connectedPair[0];
              targetEntry = connectedPair[1];

              if (!alreadyFixed.includes(sourceEntry[p['id_key']]) && !alreadyFixed.includes(targetEntry[p['id_key']])) {
                let sourceIllegal = p['illegally_connected'][0];
                let targetIllegal = p['illegally_connected'][1];
                let sourceIllegalType = sourceEntry[p['comparator_key']].includes(sourceIllegal);
                let targetIllegalType = targetEntry[p['comparator_key']].includes(targetIllegal);

                // "Tests"
                if (sourceIllegalType && targetIllegalType) {
                  // console.log("illegal pair!!!");
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
        // console.log("entriesToReplaceWith: ", entriesToReplaceWith);
        outDat = this.dt.delete_entry_by(outDat, p['id_key'], sourceEntry[p['id_key']]);
        outDat = this.dt.delete_entry_by(outDat, p['id_key'], targetEntry[p['id_key']]);
        outDat = _.concat(outDat, entriesToReplaceWith);
      } else {
        // console.log("rowdy");
        // console.log(entry);
        outDat.push(entry);
      }

    });
    // console.log(alreadyFixed);

    return _.flatten(outDat);
  }



  order_children(children, allDat, is_rootKey, p) {
    // returning an additional null if min children = 1??

    // Check if root defined in children
    // console.log(_.keys(children));
    let allKeys = [];
    let allValues = [];

    _.each(children, (child) => {
      allKeys.push(_.keys(child)[0]);
      allValues.push(_.values(child));
    });

    let rootKey;

    // find explicit root key
    _.each(allKeys, (key) => {
      let thisEntry = _.find(allDat, [p['idKey'], key]);
      if (_.keys(thisEntry).includes(is_rootKey)) {
        if (thisEntry[is_rootKey]) {
          rootKey = entry['name'];
          console.log("WE HAVE A ROOT!");
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
          // console.log("deleting!!", child);
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
    console.log('');
    console.log(" ==== beginning highest parent level search! ");
    let highestParent;
    let highestParentalLevel = -1;


    // console.log("in get highest");
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
          // console.log(this.su.abbr(entry[ p['idKey'] ],6), " is a parent of  ", this.su.abbr(childEntry[ p['idKey'] ],6));
          // console.log(entry);
          // console.log(" ---  name: ", entry[idKey], " entryParentID: ", entryParentID)

          if (entryParentID) {
            currParent = entry[idKey];
            currParentalLevel++;
          }

          entryParentID = entry[parentalKey];
        } else {
          // console.log("no ", idKey, " of ", entryParentID);
          // console.log("BUT:");
          // console.log(this.da.get_arr_of_vals_from_arr_dict_by_key(inDat,idKey));
        }

        if (!parentsTraversed.includes(currParent) && currParent && currParentalLevel > highestParentalLevel) {
          console.log("parents traversed: ", parentsTraversed);
          highestParentalLevel = currParentalLevel;
          highestParent = currParent;
        }

      }

    });
    // console.log("PT: ", parentsTraversed);
    // console.log("== RETURNING highestParent: ", highestParent);
    this.su.print_blank_lines(5);
    return highestParent;
  }


}
