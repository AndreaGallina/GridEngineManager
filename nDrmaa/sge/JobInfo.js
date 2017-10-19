"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _JobInfo2 = require("../JobInfo");

var _JobInfo3 = _interopRequireDefault(_JobInfo2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @fileoverview Class providing information about a completed Grid Engine job.
 *
 * @author Andrea Gallina
 */

/**
 * Class providing information about a completed Grid Engine job.
 * @extends JobInfo
 */
var JobInfoImpl = function (_JobInfo) {
  _inherits(JobInfoImpl, _JobInfo);

  /**
   * Create a JobInfo object with the info passed in the argument
   * @param {Object} info
   */
  function JobInfoImpl(info) {
    _classCallCheck(this, JobInfoImpl);

    var _this = _possibleConstructorReturn(this, (JobInfoImpl.__proto__ || Object.getPrototypeOf(JobInfoImpl)).call(this));

    var isJobArrayResult = !info.jobnumber; // Whether we are dealing with the info of an array job

    if (!isJobArrayResult) {
      // If we are dealing with a single job (or an array job with a single task)
      // just copy the resulting information in the corresponding fields
      _this.jobId = info.jobnumber;
      _this.exitStatus = info.exit_status;
      _this.failed = info.failed;
    } else {
      // Otherwise, the properties "exitStatus" and "failed" become arrays where we push
      // the resulting exit statuses of each task belonging to the array job.
      _this.exitStatus = [];
      _this.failed = [];
      for (var taskId in info) {
        if (info.hasOwnProperty(taskId)) {
          _this.jobId = info[taskId]["jobnumber"];
          _this.exitStatus.push(info[taskId]["exit_status"]);
          _this.failed.push(info[taskId]["failed"]);
        }
      }
    }
    _this.rawInfo = info;
    return _this;
  }

  return JobInfoImpl;
}(_JobInfo3.default);

exports.default = JobInfoImpl;