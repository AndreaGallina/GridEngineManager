"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @fileoverview Class representing a job submitted to the DRMS, including various information about the job.
 *
 * @author Andrea Gallina
 */

/**
 * Class representing a job submitted to the DRMS, including various information about the job.
 */
var Job =
/**
 * Create a Job object
 * @param {number} jobId - The id of the job
 * @param {string} sessionName - Name of the belonging session
 * @param {JobTemplate} jobTemplate - Job's submission options
 * @param {boolean} isJobArray - Whether the job is an array job
 * @param {?number} jobArrayStart - Starting array job index
 * @param {?number} jobArrayEnd - Ending array job index
 * @param {?number} jobArrayIncr - Increment array job index
 */
function Job(jobId, sessionName, jobTemplate) {
  var isJobArray = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var jobArrayStart = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
  var jobArrayEnd = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
  var jobArrayIncr = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : null;

  _classCallCheck(this, Job);

  /**
   * The id of the job
   * @type {number}
   */
  this.jobId = jobId;

  /**
   * Name of the belonging session
   * @type {string}
   */
  this.sessionName = sessionName;

  /**
   * Template used for creating the job (i.e. job's submission options)
   * @type {JobTemplate}
   */
  this.jobTemplate = jobTemplate;

  /**
   * Whether it's an array job
   * @type {boolean}
   */
  this.isJobArray = isJobArray || false;

  /**
   * Starting array job index
   * @type {Number|null}
   */
  this.jobArrayStart = parseInt(jobArrayStart) || null;

  /**
   * Ending array job index
   * @type {Number|null}
   */
  this.jobArrayEnd = parseInt(jobArrayEnd) || null;

  /**
   * Increment array job index
   * @type {Number|null}
   */
  this.jobArrayIncr = parseInt(jobArrayIncr) || null;

  console.log("Created" + (this.isJobArray ? " array " : " ") + "job: " + this.jobId + ", " + this.sessionName + (this.isJobArray ? ", " + this.jobArrayStart + "-" + this.jobArrayEnd + ":" + this.jobArrayIncr : ""));
};

exports.default = Job;