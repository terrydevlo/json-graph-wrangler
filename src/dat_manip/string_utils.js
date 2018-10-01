import 'lodash';

let prettyjson;
try {
  if (!window) {
    prettyjson = require('prettyjson');
  }
} catch(error) {
  prettyjson = require('prettyjson');
}

export default class StrUtils {
  constructor() {

  }
  l(toPrint){
    if (_.isArray(toPrint)){
      _.each(toPrint, (i) => {
        console.log( i)
      });
    } else {
      console.log(toPrint)
    }
  }

  cl(toPrint){
    console.log(prettyjson.render(toPrint));
    // console.log(toPrint);

  }

  is_number( str ){
    return !isNaN( Number( str ) );
  }

  has_numbers(t) {
    let regex = /\d/g;
    return regex.test(t);
  }

  print_blank_lines(nLines, header) {
    _.each(_.range(0, nLines), (v) => {
      console.log('');
    });
    if (header) {
      console.log(header);
    }
  }

  abbr(str, nLetters) {
    let outWords = [];
    _.each(_.words(str), (word) => {
      // let truncWord = _.truncate(word, {'length':nLetters});
      // console.log(truncWord);
      outWords.push(word.substring(0, nLetters));
    });
    return _.join(outWords, " ");
  }

  get_str_as_diff_between_words_from_both_arrays(arr1, arr2) {

    let outStr = _.join(_.difference(_.words(arr1), _.words(arr2)), " ");
    if (outStr) {
      outStr += " - ";
    }
    outStr += _.join(_.difference(_.words(arr2), _.words(arr1)), " ");
    return outStr;
  }


  get_str_as_diff_between_words_from_first_array(arr1, arr2) {

    let outStr = _.join(_.difference(_.words(arr1), _.words(arr2)), " ");

    return outStr;
  }

  upper_first_char_in_word(strWithWords, keepSpecials) {
    let outWords = [];
    let inWords;

    if (!keepSpecials) {
      inWords = _.words(strWithWords);
    } else {
      inWords = strWithWords.split(" ");
    }

    _.each(inWords, (inWord) => {
      outWords.push(_.upperFirst(inWord))
    });
    let outStr = _.join(outWords, " ");
    return outStr;
  }


  modify_str(inStr, p) {
    let outStr = _.clone(inStr);
    let matchedCriteria = true;
    // checks to see if this should be carried out
    if (p['min_length']) {
      if (inStr.length < p['min_length']) {
        return inStr;
      }
    }

    if (p['match_value_contains']) {
      if (inStr.search(p['match_value_contains']) < 1) {
        return inStr;
      }
    }


    if (p['key_val_matching']) {
      let pKeyValMatch = p['key_val_matching'];
      if (pKeyValMatch['match_suffix']) {
        if (!_.endsWith(inStr, pKeyValMatch['match_suffix'])) {
          matchedCriteria = false;
          return inStr;
        } else {
          console.log(inStr, " suffix doesn't match");
        }
      }
      if (pKeyValMatch['match_prefix']) {
        if (!_.startsWith(inStr, pKeyValMatch['match_prefix'])) {
          matchedCriteria = false;
          return inStr;
        } else {
          console.log(inStr, " suffix doesn't match");
        }
      }
      if (p['match_identically']) {
        // console.log(p['match_identically'], " m ", val.length);

        if ((p['match_identically'].indexOf(inStr) === 0) || (p['match_identically'].length === inStr.length)) {
        } else {
          return inStr;
        }
      }
    }


    if (matchedCriteria) {

      // perform modification
      if (p['swop_beg_and_end']) {
        inStr = inStr.toLowerCase();
        let startSplitPos = inStr.indexOf(p['split_at_str']);
        let endSplitPos = startSplitPos + p['split_at_str'].length;
        let newEndStr = inStr.substring(0, startSplitPos);
        let newStartStr = inStr.substring(endSplitPos);
        outStr = newStartStr + p['new_split_str'] + newEndStr;
      }

      if (p['type_of_caps']) {
        if (p['type_of_caps'] === "upperFirst") {
          outStr = this.upper_first_char_in_word(outStr, p['keep_specials']);
        }
      }

      if (p['append_str']) {
        outStr += p['append_str'];
      }

      if (p['replace_this_suffix_string']) {
        console.log("p: ", p);
        let lastIndex = outStr.lastIndexOf(p['replace_this_suffix_string']);
        console.log("outStr: ", outStr);
        console.log("lastIndex: ", lastIndex);
        outStr = outStr.substring(0, lastIndex);
        outStr = outStr + p['with_this_sub_string'];
      }

      if (p['replace_this_prefix_string']) {
        let outLength = p['replace_this_prefix_string'].length;
        outStr = outStr.substring(outLength);
        outStr = p['with_this_sub_string'] + outStr
      }



      // if (p['replace_this_suffix_string']) {
      //   let lastIndex = outStr.lastIndexOf(p['replace_this_suffix_string']);
      //   outStr = outStr.substring( 0, lastIndex );
      //   outStr = outStr + p['with_this_sub_string'];
      // }

      if (p['complete_replacement']) {
        outStr = p['with_this_string'];
      }

      if (p['replace_this_sub_string']) {
        outStr = outStr.replace(p['replace_this_sub_string'], p['with_this_sub_string'])
      }

      if (p['truncate_at']) {
        let matchPos = outStr.indexOf(p['truncate_at']);
        if (matchPos > 0){
          outStr = outStr.substring(0, matchPos);

        }
      }

      if (p['to_lower']) {
          outStr = outStr.toLowerCase();
      }

    }
    return outStr.trim();
  }

  get_common_words_in(arr1, arr2) {

    let outStr = _.join(_.intersection(_.words(arr1), _.words(arr2)), " ");
    // outStr += _.join( _.intersection( _.words(arr2), _.words(arr1))," ");
    return outStr;
  }

  extract_filename(filenamePlusPathPlusExt) {
    let filenamePlusExt = this.strip_paths(filenamePlusPathPlusExt);
    let filename = this.strip_extension(filenamePlusExt);
    return filename;

  }

  strip_paths(inputStr) {
    let outStr = inputStr;
    let folderLocation = inputStr.lastIndexOf("/");

    if (folderLocation && (folderLocation > -1)) {
      folderLocation += 1;
      outStr = inputStr.substring(folderLocation);

    } else {
      folderLocation = inputStr.lastIndexOf("\\");
      folderLocation += 1;

      if (folderLocation && (folderLocation > -1)) {
        outStr = inputStr.substring(folderLocation);
      }

    }
    return outStr;
  }


  extract_paths(inputStr) {
    let outStr = inputStr;
    let folderLocation = inputStr.lastIndexOf("/");

    if (folderLocation && (folderLocation > -1)) {
      folderLocation += 1;
      outStr = inputStr.substring(0, folderLocation);

    } else {
      folderLocation = inputStr.lastIndexOf("\\");
      folderLocation += 1;

      if (folderLocation && (folderLocation > -1)) {
        outStr = inputStr.substring(0, folderLocation);
      }

    }
    return outStr;
  }


  strip_extension(inputStr) {

    let periodLocation = inputStr.lastIndexOf(".");
    let outStr = inputStr.substring(0, periodLocation);
    return outStr;
  }

  get_extension(inputStr) {

    let periodLocation = inputStr.lastIndexOf(".");
    let outStr = inputStr.substring(periodLocation);
    return outStr;
  }
}
