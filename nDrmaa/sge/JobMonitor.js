"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sgeCli = require("./sge-cli");

var sge = _interopRequireWildcard(_sgeCli);

var _Exceptions = require("../Exceptions");

var Exception = _interopRequireWildcard(_Exceptions);

var _Job = require("../Job");

var _Job2 = _interopRequireDefault(_Job);

var _events = require("events");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _refreshInterval = 1000; // Refresh interval for the monitor
/**
 * @fileoverview Class for monitoring jobs' completion.
 *
 * @author Andrea Gallina
 */

/**
 * Class for monitoring jobs' completion.
 * @extends EventEmitter
 */

var JobMonitor = function (_EventEmitter) {
  _inherits(JobMonitor, _EventEmitter);

  /**
   * Monitor initialization.
   */
  function JobMonitor() {
    _classCallCheck(this, JobMonitor);

    var _this = _possibleConstructorReturn(this, (JobMonitor.__proto__ || Object.getPrototypeOf(JobMonitor)).call(this));

    _this.setMaxListeners(0); // Set to infinity the max number of listeners for this EventEmitter.
    _this.JobsQueue = []; // List of jobs to monitor
    _this.startMonitor(); // Starts monitoring
    console.log("Job Monitor started");
    return _this;
  }

  /**
   * Registers a list of jobs to monitor for completion status.
   * @param {Job[]} jobs - List of jobs to monitor.
   * @throws {module:nDrmaaExceptions.InvalidArgumentException} InvalidArgumentException - The array passed does not
   *    contain elements of class Job
   */


  _createClass(JobMonitor, [{
    key: "registerJobs",
    value: function registerJobs(jobs) {
      var _this2 = this;

      jobs.forEach(function (job) {
        if (!(job instanceof _Job2.default)) throw new Exception.InvalidArgumentException("Function registerJob(jobs): argument 'jobs' must be an array of " + " elements of class Job");
        _this2.JobsQueue.push(job);
      });
    }

    /**
     * Starts monitoring.
     */

  }, {
    key: "startMonitor",
    value: function startMonitor() {
      var _this3 = this;

      this.monitor = setInterval(function () {
        _this3.getJobs();
      }, _refreshInterval);
    }

    /**
     * Fires when a job has completed its execution.
     * Returns the Id of the completed job.
     *
     * @event JobCompleted
     * @type {number}
     */

    /**
     * Fires when a job has encountered an error and could not complete its execution.
     * Returns the Id of the job in error.
     *
     * @event JobError
     * @type {number}
     */

    /**
     * Fires when the invocation of command qstat could not be executed due to some error.
     * Returns the error reason.
     *
     * @event qstatError
     * @type {*}
     */

    /**
     * Get the list of currently active jobs from qstat, and emit event according to the completion status of each
     * registered job: if a job is registered but does not show up on the list returned by qstat, it emits a "JobCompleted"
     * event with the id of the job as a message; otherwise, if it appears on the list but its status is marked as "ERROR",
     * emit the event "JobError" along with the id of the job.
     * @fires JobCompleted
     * @fires JobError
     * @fires qstatError
     */

  }, {
    key: "getJobs",
    value: function getJobs() {
      var _this4 = this;

      if (this.JobsQueue.length > 0) {
        sge.qstat().then(function (qstatJobs) {
          _this4.JobsQueue.forEach(function (job) {

            var jobId = job.jobId;

            // The job does not appear on the list returned by qstat -> COMPLETED
            if (!qstatJobs[jobId]) {
              _this4.JobsQueue.splice(_this4.JobsQueue.indexOf(job), 1);
              _this4.emit("JobCompleted", jobId);
            }
            // The job does not appear on the list returned by qstat -> check if it is in error state
            else {
                var jobStatus = job.isJobArray ? _parseJobArrayStatus(qstatJobs[jobId]) : _parseJobStatus(qstatJobs[jobId]["jobState"]);

                if (jobStatus === "ERROR") {
                  _this4.JobsQueue.splice(_this4.JobsQueue.indexOf(job), 1);
                  _this4.emit("JobError", jobId);
                }
              }
          });
        }, function (err) {
          _this4.emit("qstatError", err);
        });
      }
    }
  }]);

  return JobMonitor;
}(_events.EventEmitter);

/**
 * Helper method for retrieving the status of a job
 * @param {string} jobStatus - raw status parsed from qstat
 * @returns {string} - a more explicative status.
 * @private
 */


function _parseJobStatus(jobStatus) {
  switch (jobStatus) {
    case "qw":
      return "QUEUED";
      break;

    case "hqw":
    case "hRqw":
    case "hRwq":
      return "ON_HOLD";
      break;

    case "r":
    case "t":
    case "Rr":
    case "Rt":
      return "RUNNING";
      break;

    case "s":
    case "ts":
    case "S":
    case "tS":
    case "T":
    case "tT":
    case "Rs":
    case "Rts":
    case "RS":
    case "RtS":
    case "RT":
    case "RtT":
      return "SUSPENDED";
      break;

    case "Eqw":
    case "Ehqw":
    case "EhRqw":
      return "ERROR";
      break;
  }
}

/**
 * Function to determine whether an array job is in error state. It suffices that only one task of the array job
 * is in error state for the whole job to be marked as in error.
 * @param {Object} jobArrayTasks - list of tasks of the array job retrieved from qstat
 * @returns {string} - "ERROR" if the array job is in error state, "UNDETERMINED" otherwise
 * @private
 */
function _parseJobArrayStatus(jobArrayTasks) {
  var jobStatus = "UNDETERMINED";
  for (var taskId in jobArrayTasks) {
    if (jobArrayTasks.hasOwnProperty(taskId)) {
      var taskStatus = _parseJobStatus(jobArrayTasks[taskId].jobState);
      if (taskStatus === "ERROR") return "ERROR";
    }
  }
  return jobStatus;
}

exports.default = JobMonitor;