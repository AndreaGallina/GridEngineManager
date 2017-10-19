"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @fileoverview Abstract class representing the operations available for interacting with the DRM.
 *
 * @author Andrea Gallina
 */

/**
 * Wait indefinitely for a result.  Used with the Session.wait() and Session.synchronize() methods.
 * @const
 */
var TIMEOUT_WAIT_FOREVER = -1;

/**
 * Suspend the job.  Used with the Session.control() method.
 * @const
 */
var SUSPEND = 0;

/**
 * Resume the job.  Used with the Session.control() method.
 * @const
 */
var RESUME = 1;

/**
 * Put the job on hold.  Used with the Session.control() method.
 * @const
 */
var HOLD = 2;

/**
 * Release the hold on the job.  Used with the Session.control() method.
 * @const
 */
var RELEASE = 3;

/**
 * Kill the job.  Used with the Session.control() method.
 * @const
 */
var TERMINATE = 4;

/**
 * All jobs submitted during this DRMAA session.  Used with the Session.synchronize(),
 * Session.getJobProgramStatus() and Session.control() methods.
 * @const
 */
var JOB_IDS_SESSION_ALL = "DRMAA_JOB_IDS_SESSION_ALL";

/**
 * Abstract class representing the operations available for interacting with the DRM.
 */

var Session = function () {
  function Session() {
    _classCallCheck(this, Session);

    if (new.target === Session) {
      throw new TypeError("Cannot construct Session instances from its abstract class.");
    }

    /**
     * Session name.
     * @type {string}
     */
    this.sessionName = "";

    /**
     * Contact information.
     * @type {string}
     */
    this.contact = "";

    /**
     * Job monitor
     * @type {JobMonitor}
     */
    this.jobsMonitor = null;
  }

  // -- Methods for retrieving the values of the constants -- //


  _createClass(Session, [{
    key: "runJob",


    /**
     * Submits a job with attributes defined in the JobTemplate jobTemplate parameter.
     * @param {JobTemplate} jobTemplate - Attributes of the job to be run.
     */
    value: function runJob(jobTemplate) {}

    /**
     * Submit a set of parametric jobs, dependent on the implied loop index, each with attributes defined in the jobTemplate.
     * @param {JobTemplate} jobTemplate - Attributes of each job belonging to the array job to be run.
     * @param {number} start - the starting value for the loop index
     * @param {?number} end - the terminating value for the loop index
     * @param {?number} incr - the value by which to increment the loop index each iteration
     */

  }, {
    key: "runBulkJobs",
    value: function runBulkJobs(jobTemplate, start, end, incr) {}

    /**
     * Get the program status of the job(s) specified inside the argument jobIds.
     * @param {number[]} jobIds - The id(s) of the job(s) whose status is to be retrieved
     */

  }, {
    key: "getJobProgramStatus",
    value: function getJobProgramStatus(jobIds) {}

    /**
     * The synchronize() method returns when all jobs specified in jobIds have failed or finished
     * execution. If jobIds contains {@link JOB_IDS_SESSION_ALL}, then this method waits for all
     * jobs submitted during this DRMAA session.
     *
     * The caller may specify a timeout, indicating how many milliseconds to wait for this call to complete before
     * timing out. The special value {@link TIMEOUT_WAIT_FOREVER} can be used to wait indefinitely for a result.
     *
     * @param {(number[]|string)} jobIds  - The ids of the jobs to synchronize.
     * @param {?number} timeout            - The maximum number of milliseconds to wait for jobs' completion.
     */

  }, {
    key: "synchronize",
    value: function synchronize(jobIds, timeout) {}

    /**
     * Wait until a job is complete and the information regarding the job's execution are available.
     *
     * The caller may use timeout, specifying how many milliseconds to wait for this call to complete before timing out.
     * The special value {@link TIMEOUT_WAIT_FOREVER} can be uesd to wait indefinitely for a result.
     *
     * @param {number} jobId - the id of the job for which to wait
     * @param {?number} timeout - amount of time in milliseconds to wait for the job to terminate its execution.
     */

  }, {
    key: "wait",
    value: function wait(jobId, timeout) {}

    /**
     * Hold, release, suspend, resume, or kill the job identified by jobId.
     * If jobId is {@link JOB_IDS_SESSION_ALL}, then this routine acts on all jobs submitted
     * during this DRMAA session up to the moment control() is called.
     *
     * The legal values for action are:
     *  - {@link SUSPEND}: stop the job,
     *  - {@link RESUME}: (re)start the job,
     *  - {@link HOLD}: put the job on-hold,
     *  - {@link RELEASE}: release the hold on the job,
     *  - {@link TERMINATE}: kill the job.
     *
     * This routine returns once the action has been acknowledged by the DRM system, but does not wait
     * until the action has been completed.
     *
     * @param {number|string} jobId  - The id of the job to control, or the constant {@link JOB_IDS_SESSION_ALL}
     * @param {string} action - The control action to be taken
     */

  }, {
    key: "control",
    value: function control(jobId, action) {}
  }, {
    key: "TIMEOUT_WAIT_FOREVER",
    get: function get() {
      return TIMEOUT_WAIT_FOREVER;
    }
  }, {
    key: "SUSPEND",
    get: function get() {
      return SUSPEND;
    }
  }, {
    key: "RESUME",
    get: function get() {
      return RESUME;
    }
  }, {
    key: "HOLD",
    get: function get() {
      return HOLD;
    }
  }, {
    key: "RELEASE",
    get: function get() {
      return RELEASE;
    }
  }, {
    key: "TERMINATE",
    get: function get() {
      return TERMINATE;
    }
  }, {
    key: "JOB_IDS_SESSION_ALL",
    get: function get() {
      return JOB_IDS_SESSION_ALL;
    }
  }]);

  return Session;
}();

exports.default = Session;