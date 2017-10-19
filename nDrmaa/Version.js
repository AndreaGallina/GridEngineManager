"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Exceptions = require("./Exceptions");

var Exceptions = _interopRequireWildcard(_Exceptions);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /**
                                                                                                                                                           * @fileoverview Class representing the version of a DRMS
                                                                                                                                                           *
                                                                                                                                                           * @author Andrea Gallina
                                                                                                                                                           */

/**
 * Class representing the version of a DRMS
 */
var Version =
/**
 * Creates a Version instance
 * @param {number|string} major - Major version number
 * @param {number|string} minor - Minor version number
 */
function Version(major, minor) {
  _classCallCheck(this, Version);

  /**
   * Major version number.
   * @type {string}
   */
  this.major = "";

  /**
   * Minor version number.
   * @type {string}
   */
  this.minor = "";

  if (typeof major === 'string' && typeof minor === 'string' || !isNaN(major) && !isNaN(minor)) {
    this.major = major;
    this.minor = minor;
  } else {
    throw new Exceptions.InvalidArgumentException("Invalid argument type for Version");
  }
};

exports.default = Version;