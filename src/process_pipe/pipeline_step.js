// Maps the specified pipeline functions to the js functions in "dat_manip"

import 'lodash';
import TreeUtils from '../dat_manip/tree_utils.js';
import DictArrUtils from "../dat_manip/dict_array_utils.js";
import DataTrans from "../dat_manip/data_trans.js";
import DataSelect from "../dat_manip/data_select.js";
import StrUtils from "../dat_manip/string_utils.js";

import DataIO from "../dat_manip/data_io.js";
import GraphUtils from "../dat_manip/graph_utils.js"

export default class PipelineStep {

  constructor(dataRootDir, webRootDir) {
    this.su = new StrUtils();
    this.ds = new DataSelect();
    this.da = new DictArrUtils();
    this.treeUtils = new TreeUtils();
    this.dt = new DataTrans();
    this.dataRootDir = dataRootDir;
    this.webRootDir = webRootDir;
    this.io = new DataIO();
    this.gu = new GraphUtils();
  }

  run_step(p, dat, outputFilenames, specifiedDatFile) {
    
    let outData = {};
    let previousFilename;
    let lastStepProps;

    // For filename
    let dKeys = _.keys(dat);
    if (dKeys.length === 1) {
      dat = dat[dKeys[0]];
    } else {
      // console.log("multiple datasets detected!");
    }
    let referenceDat, datToManip, newRefDat;

    _.forOwn(p, (mappingFuncsarray, filename) => {
      // for each main mapping operation

      let newDat;
      if (specifiedDatFile){
         newDat = dat[specifiedDatFile]; // use raw input data
         // console.log("dat keys: ", _.keys(dat));
         // console.log("newDat: ", newDat);

      } else {
        newDat = _.cloneDeep(dat); // use raw input data
      }

      console.log("  == PIPELINE STEP ", filename);

      _.each(mappingFuncsarray, (mappingFuncs) => {
        // for each mapping func

        _.forOwn(mappingFuncs, (properties, mappingFunc) => {
          if (properties['exclude_step']){ return false; }
          // split mapping funcs and p and perform
          lastStepProps = properties;
          let repeatStepStr = 'repeat_step__';
          if (mappingFunc.includes(repeatStepStr)) {
            let repeatStepLoc = mappingFunc.search(repeatStepStr) + repeatStepStr.length;
            mappingFunc = mappingFunc.substring(repeatStepLoc);
          }
          console.log("     = MAPPING FUNC: ", mappingFunc);

          if (properties['use_newDat_as_property']){
            properties['use_newDat_as_property'] = newDat;
          }
          if (properties['reference_file_key']) {
            [referenceDat, datToManip] = this.ds.get_reference_dataset(newDat, properties);
          }
          if (properties['use_origDat_as_newDat']){
            newDat = _.clone(dat);
          }
          if (properties['use_newDat_as_datToManip']){
            datToManip = _.clone(newDat);
          }
          if (!datToManip){
            datToManip = _.clone(newDat);
          }


          switch (mappingFunc) {

            case 'create_obj_from_template':
              newDat = this.dt.create_obj_from_template(newDat, properties);
              break;

            case 'filter_matching':
              newDat = this.dt.filter_matching(newDat, properties);
              break;

            case 'extract_uniques_and_map':
              [newDat, []] = this.dt.extract_uniques_and_map(newDat, properties);
              break;

            case 'extract_uniques_from_keys':
              newDat = this.ds.extract_uniques_from_keys(newDat, properties);
              break;

            case 'extract_nested_objects_into_array':
              newDat = this.ds.extract_nested_objects_into_array(datToManip, referenceDat, properties);
              break;

            case 'extract_categories_into_files':
              newDat = this.ds.extract_categories_into_files(datToManip, referenceDat, properties);
              break;

            case 'map_keys_to_keys':
              newDat = this.dt.map_keys_to_keys(newDat, properties);
              break;

            case 'map_keys_to_keys_for_ordering':
              newDat = this.dt.map_keys_to_keys_for_ordering(newDat, properties);
              break;

            case 'select_subset_of_keys_from_arr':
              newDat = this.ds.select_subset_of_keys_from_arr(newDat, properties);
              break;

            case 'rename_keys':
              newDat = this.dt.rename_keys(newDat, properties);
              break;

            case 'map_values_to_values':
              newDat = this.dt.map_values_to_values(datToManip, properties, referenceDat);
              break;

            case 'map_values_to_values_nested':
              newDat = this.dt.map_values_to_values_nested(datToManip, properties, referenceDat);
              break;

            case 'map_keys_to_values':
              newDat = this.dt.map_keys_to_values(newDat, properties);
              break;

            case 'transpose_key_vals_to_new_labels':
              newDat = this.dt.transpose_key_vals_to_new_labels(newDat, properties);
              break;

            case 'swop_key_vals':
              newDat = this.dt.swop_key_vals(newDat, properties);
              break;

            case 'map_keys_if':
              newDat = this.dt.map_keys_if(newDat, properties);
              break;

            case 'delete_properties':
              newDat = this.dt.delete_properties(newDat, properties);
              break;

            case 'delete_by_matching_keys':
              newDat = this.dt.delete_by_matching_keys(newDat, properties);
              break;

            case 'update_entries':
              newDat = this.dt.update_entries(newDat, properties);
              break;

            case 'join_values_of_specified_keys':
              newDat = this.dt.join_values_of_specified_keys(newDat, properties);
              break;

            case 'append_str_to_arr':
              newDat = this.dt.append_str_to_arr(newDat, properties);
              break;

            case 'append_suffix_to_key':
              newDat = this.dt.append_suffix_to_key(newDat, properties);
              break;

            case 'insert_prefix_to_value':
              newDat = this.dt.insert_prefix_to_value(newDat, properties);
              break;

            case 'map_arr_to_obj':
              newDat = this.dt.map_arr_to_obj(newDat, properties);
              break;

            case 'map_names_from_ids':
              newDat = this.dt.map_names_from_ids(newDat, properties);
              break;

            case 'rename_str_values':
              newDat = this.dt.rename_str_values( newDat, properties );
              break;

            case 'replace_str_values':
              newDat = this.dt.replace_str_values( newDat, properties );
              break;

            case 'replace_matching_values':
              newDat = this.dt.replace_matching_values( newDat, properties );
              break;

            case 'remove_duplicate_edges':
              newDat = this.gu.remove_duplicate_edges( newDat, properties );
              break;

            case 'map_keys_to_keys_nested':
              newDat = this.dt.map_keys_to_keys_nested(newDat, properties);
              break;

            case 'create_unique_ids':
              newDat = this.dt.create_unique_ids(outData, properties);
              break;

            case 'make_data_include_all_keys':
              newDat = this.dt.make_data_include_all_keys(outData, dat, properties);
              break;

            case 'map_and_assign_matching':
              newDat = this.dt.map_and_assign_matching(outData, dat, properties);
              break;

            case 'map_connected_as_trees':
              newDat = this.treeUtils.map_connected_as_trees(newDat, dat, properties);
              break;

            case 'make_tree_from_unconnected':
              newDat = this.treeUtils.make_tree_from_unconnected(newDat, dat, properties);
              break;

            case 'extract_invalid_connections':
              newDat = this.treeUtils.extract_invalid_connections(newDat, properties);
              break;

            case 'map_container_graph':
              newDat = this.treeUtils.map_container_graph(newDat, properties);
              break;

            case 'add_nodes_compute_levels':
              newDat = this.treeUtils.add_nodes_compute_levels(referenceDat, datToManip, properties);
              break;

            case 'label_edges_with_label':
              newDat = this.treeUtils.label_edges_with_label(datToManip, properties);
              break;

            case 'extract_nodes_and_label':
              newDat = this.treeUtils.extract_nodes_and_label(referenceDat, datToManip, properties);
              break;

            case 'replace_ids_with_objects':
              newDat = this.dt.replace_ids_with_objects(referenceDat, datToManip, properties);
              break;

            case 'add_id_to_objects':
              // [] is returned as count value not used in final output
              [newDat, []] = this.dt.add_id_to_objects(newDat, properties);
              break;

            case 'add_new_object_for_object_property':
              newDat = this.dt.add_new_object_for_object_property(newDat, properties);
              break;

            case 'add_property_object_for_matching_data':
              [newDat, []] = this.dt.add_property_object_for_matching_data(newDat, properties);
              break;

            case 'add_property_array_from_matching_data':
              // [] is returned as value not used in final output
              [newDat, []] = this.dt.add_property_array_from_matching_data(newDat, newDat, properties);
              break;

            case 'add_property_from_matching_data':
              // [] is returned as value not used in final output
              [newDat, []] = this.dt.add_property_from_matching_data(newDat, newDat, properties);
              break;

            case 'create_arrays_from_files':
              newDat = this.dt.create_arrays_from_files(dat, properties);
              break;

            case 'map_property_from_reference_property':
              newDat = this.dt.map_property_from_reference_property(referenceDat, datToManip, properties);
              break;

            case 'map_property_from_reference_property_2':
              newDat = this.dt.map_property_from_reference_property_2(referenceDat, datToManip, properties);
              break;

            case 'replace_property_values_with_neighbours':
              newDat = this.treeUtils.replace_property_values_with_neighbours(newDat, properties);
              break;

            case 'join_trees_that_share_root_ref_lyphs':
              newDat = this.treeUtils.join_trees_that_share_root_ref_lyphs(newDat, properties);
              break;

            case 'map_nodes_to_host_lyphs':
              newDat = this.treeUtils.map_nodes_to_host_lyphs(referenceDat,  datToManip, properties);
              break;

            case 'replace_matching_keys_value_with':
              newDat = this.dt.replace_matching_keys_value_with(referenceDat,  datToManip, properties);
              break;

            case 'select_matching':
              newDat = this.ds.select_matching( newDat, properties );
              break;

            case 'ensure_no_duplicates_of_these_keys':
              newDat = this.dt.ensure_no_duplicates_of_these_keys( newDat, properties);
              break;

            case 'merge_duplicates':
              [newDat, []] = this.dt.merge_duplicates( newDat, properties );
              break;

            case 'remove_duplicates':
              newDat = this.da.remove_duplicates( newDat );
              break;

            case 'graph_obj_properties_to_graphs_referring_to_id':
              newDat = this.gu.graph_obj_properties_to_graphs_referring_to_id( newDat, properties );
              break;


            case 'merge_with_internal_arrays_concatenated':
              newDat = this.da.merge_with_internal_arrays_concatenated(referenceDat, datToManip);
              break;

            case 'flatten_obj':
              newDat = this.da.flatten_obj(newDat);
              break;

            case 'merge_simply':

              if (!referenceDat){

                let arr1 = _.values(dat)[0];
                let arr2 =  _.values(dat)[1];

                newDat = _.merge(arr1, arr2);

              } else {
                newDat = _.merge(referenceDat, datToManip);
              }
              break;

            case 'concat_simply':
              newDat = _.concat(referenceDat, datToManip);
              break;


            case 'concat_all_inputs':
              newDat = _.concat(_.values(dat));
              break;

            case 'subtract_difference':
              newDat = this.da.subtract_difference(_.values(dat));
              break;

            case 'diff_objs_of_equivalent_data_hierarchy':
              newDat = this.da.diff_objs_of_equivalent_data_hierarchy( referenceDat, datToManip );
              break;

            case 'merge_two_datasets':
              [newDat, [], newRefDat] = this.dt.merge_two_datasets( referenceDat, datToManip );
              break;

            case 'extract_objs_not_referred_to':
              newDat = this.ds.extract_objs_not_referred_to( newDat, properties );
              break;

            case 'group_by':
              newDat = this.ds.group_by( newDat, properties );
              break;

            case 'slice':
              newDat = this.da.slice( newDat, properties );
              break;

            case 'make_2d_hier_list_to_nested_json':
              newDat = this.gu.make_2d_hier_list_to_nested_json( newDat, properties );
              break;

            case 'make_connectivity_matrix_to_source_target_graph':
              newDat = this.gu.make_connectivity_matrix_to_source_target_graph( newDat, properties );
              break;
          }


          if (newRefDat){

            let outPath = this.su.extract_paths( outputFilenames[0] );
            let outFileName = properties['reference_file_key'];
            let filePath = this.io.combine_paths(this.dataRootDir, outPath);
            let refDatFileNameAndPath = filePath + outFileName;

            let savedPromise = Promise.resolve(this.io.save_data(refDatFileNameAndPath, newRefDat, this.webRootDir));
            savedPromise.then(dat => {
              // this.da.print_keys(newRefDat, "");
            });
          }

        }); // End split mapping func and p and perform

      }); // End for each set of mapping funcs

      outData[filename] = newDat;
      this.previousFileName = filename;

    });



    _.each( outputFilenames, async (outputFilename) => {
      let filenameAndPath = this.io.combine_paths(this.dataRootDir, outputFilename);
      console.log("$$$      SAVED DATA  ", filenameAndPath, " ", this.webRootDir);

      if (!this.su.strip_paths(filenameAndPath).includes(".")){ // if no file name specified, derive from data
        console.log(filenameAndPath, " missing ext");
        _.each(outData[this.previousFileName], (dataset) => {
          let newFilenameAndPath = filenameAndPath + dataset['filename'];
          let newData = dataset['data']
          let savedPromise = Promise.resolve(this.io.save_data(newFilenameAndPath, newData, this.webRootDir));
          savedPromise.then(dat => {
          }).then(dat => {});

        });
      } else {
        let savedPromise = Promise.resolve(this.io.save_data(filenameAndPath, outData[this.previousFileName], this.webRootDir));
        savedPromise.then(dat => {
          // this.da.print_keys(outData[this.previousFileName], "");
        }).then(dat => {});
      }
    });
    return true;
  } // end map_data

}
