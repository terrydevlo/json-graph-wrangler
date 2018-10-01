// csv / tsv / json utilities functions
import DictArrUtils from "./dict_array_utils.js";
import 'lodash';

export default class JsonCsvUtils {
  constructor() {
    this.da = new DictArrUtils();
  }

  ssv_data_to_array(text) {

    let p = '',
      row = [''],
      ret = [row],
      i = 0,
      r = 0,
      s = !0,
      l;

    for (l in text) {
      l = text[l];
      if ('"' === l) {
        if (s && l === p) row[i] += l;
        s = !s;
      } else if (' ' === l && s) l = row[++i] = '';
      else if ('\n' === l && s) {
        if ('\r' === p) row[i] = row[i].slice(0, -1);
        row = ret[++r] = [l = ''];
        i = 0;
      } else row[i] += l;
      p = l;
    }
    // console.log(ret);
    return ret;
  };


  tsv_data_to_array(text) {

    let p = '',
      row = [''],
      ret = [row],
      i = 0,
      r = 0,
      s = !0,
      l;

    for (l in text) {
      l = text[l];
      if ('"' === l) {
        if (s && l === p) row[i] += l;
        s = !s;
      } else if ('\t' === l && s) l = row[++i] = '';
      else if ('\n' === l && s) {
        if ('\r' === p) row[i] = row[i].slice(0, -1);
        row = ret[++r] = [l = ''];
        i = 0;
      } else row[i] += l;
      p = l;
    }
    // console.log(ret);
    return ret;
  };



  csv_data_to_array(text) {

    let p = '',
      row = [''],
      ret = [row],
      i = 0,
      r = 0,
      s = !0,
      l;

    for (l in text) {
      l = text[l];
      if ('"' === l) {
        if (s && l === p) row[i] += l;
        s = !s;
      } else if (',' === l && s) l = row[++i] = '';
      else if ('\n' === l && s) {
        if ('\r' === p) row[i] = row[i].slice(0, -1);
        row = ret[++r] = [l = ''];
        i = 0;
      } else row[i] += l;
      p = l;
    }
    return ret;

  };


  adjacency_matrix_to_json(csvarray, p) {

    // First array is header array
    let headerarray = csvarray.shift();
    let allItems = [];
    let currItem = {};
    let val;

    let subP = p['p'];

    if (p['non_edge_val']) {
      p['non_edge_val'] = p['non_edge_val'].toString().trim();
    }
    console.log(p);
    console.log("headerarray: ", headerarray);
    console.log("csvArray headings: ", headerarray.length);

    console.log("n items: ", csvarray.length);

    csvarray.forEach((item, j) => {
      let currRowHeader = "";

      headerarray.forEach((heading, i) => {
        currItem = {};

        if (i === 0) {
          currRowHeader = item[i];

        } else {

          if (subP['create_edges']) {

            let edgeVal = item[i].toString().trim();
            // console.log("p['non_edge_val']: ", p['non_edge_val'], " edgeVal: ", edgeVal);

            if (!_.keys(p).includes('non_edge_value') || p['non_edge_val'] !== edgeVal) {

              if (!_.keys(p).includes('non_edge_value')['allow_connections_to_self'] || (heading !== item)) {
                // console.log("pushing: ", edgeVal);
                currItem["source"] = heading.trim();
                currItem["target"] = currRowHeader.trim();
                currItem["edge_type"] = edgeVal;
                allItems.push(currItem);
              }
            }
          } else {
            // only handle columns
            console.log("subP: ", subP);
            console.log("j: ", j, " i: ", i, " heading: ", heading, " item: ", item[i]);


            if (j === (i-1)) {
              currItem[subP['idKey']] = heading;
              console.log("j: ", j, " i: ", i);

              // specify node types by a sequence
              if (_.keys(subP).includes('extract_diagonals')){
                currItem['label'] = item[i];
              }
              if (_.keys(subP).includes('types_sequence')) {
                currItem['type'] = subP['types_sequence'][(i+1) % subP['types_sequence'].length]
              }
              if (_.keys(subP).includes('topology_sequence')) {
                currItem['topology'] = subP['topology_sequence'][(i+1) % subP['topology_sequence'].length]
              }
              allItems.push(currItem);
            }

          }
        }

      });
    });
    return allItems;
  }


  array_to_json(csvarray) {

    // First array is header array
    let headerarray = csvarray.shift();
    let allItems = [];
    let currItem = {};
    let val;

    csvarray.forEach(function(item) {
      currItem = {};
      headerarray.forEach(function(heading, i) {

        if (item[i] === undefined) {
          currItem[heading.trim()] = item[i];
        } else {
          currItem[heading.trim()] = item[i].trim();
        }
      });
      allItems.push(currItem);
    });
    // console.log("array to json. ", allItems);
    // throw new Error();
    // console.log( JSON.stringify(allItems) );
    return allItems;
  }


  hash_table_to_json(csvarray) {

    // First array is header array
    let hashTable = {};
    let val;

    csvarray.forEach((item) => {
      if (item.length === 2) {
        hashTable[item[0].trim()] = item[1].trim();
      }
    });
    // console.log(hashTable);
    return hashTable;
  }


  convert_txt_json_to_csv(jsonarray, filename, delimiter) {
    // dateFormat = dateFormat || 'YYYY-MM-DDTHH:mm:ss Z'; // ISO

    delimiter = delimiter || ',';

    jsonarray = this.da.make_arr_if_not(jsonarray);
    let keys = this.da.get_all_keys(jsonarray);

    let body = '';

    body += _.join(keys, delimiter) + '\r\n';

    if (jsonarray) {

      // Data
      _.each(jsonarray, function(item) {
        // console.log("item: ", item)
        if (item) {
          // console.log("item: ", item);
          for (let j = 0; j < keys.length; j++) {
            // console.log("item: ", item);
            let obj = item[keys[j]];
            if (_.isDate(obj)) {
              body += moment(obj).format(dateFormat);
            } else {
              // console.log("obj: ", obj);

              if (obj === null || obj === undefined) {
                obj = "";
              }

              obj = JSON.stringify(obj);

              // console.log("object: ", obj);
              let notSanitised = true;
              while (obj.includes('\r') || obj.includes('\n') || obj.includes(',')) {
                obj = obj.replace('\r', '');
                obj = obj.replace('\n', '');
                obj = obj.replace(',', ';');
              }
              body += obj;
            }

            if (j < keys.length - 1) {
              body += delimiter;
            }
          }
          body += '\r\n';
        }
      });


      // console.log("body: ", body);
    }
    return body;

  }
}