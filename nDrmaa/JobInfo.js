"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @fileoverview Abstract class representing the status and info of a finished job.
 *
 * @author Andrea Gallina
 */

/**
 * Abstract class representing the status and info of a finished job.
 */
var JobInfo =
/**
 * Initialize an empty JobInfo object.
 */
function JobInfo() {
  _classCallCheck(this, JobInfo);

  // Make sure that this class can't be constructed directly but only through subclasses
  if (new.target === JobInfo) {
    throw new TypeError("Cannot construct JobInfo instances from its abstract class.");
  }

  /**
   * Job id.
   * @type {number}
   */
  this.jobId = null;

  /**
   * Job's exit code.
   * @type {number}
   */
  this.exitStatus = null;

  /**
   * Job's failure code
   * @type {string}
   */
  this.failed = null;

  /**
   * Error reasons.
   * @type {string[]}
   */
  this.errors = null;

  /**
   * Whether the error was deleted using the "control(..)" API of class Session.
   * @type {boolean}
   */
  this.deleted = false;

  /**
   * Contains all the information obtained about the job's completion.
   * @type {Object}
   */
  this.rawInfo = {};
};

exports.default = JobInfo;