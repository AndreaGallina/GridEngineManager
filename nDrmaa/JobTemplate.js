"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @fileoverview Class representing a Job Template.
 *
 * @author Andrea Gallina
 */

/**
 * Class representing a Job Template.
 * @see http://gridscheduler.sourceforge.net/htmlman/htmlman3/drmaa_attributes.html
 */
var JobTemplate =
/**
 * Creates a new instance of JobTemplate from the object passed in input.
 * @param {!Object} params
 */
function JobTemplate(params) {
  _classCallCheck(this, JobTemplate);

  /**
   * Specifies the remote command to execute. The  remote_command
   * must  be  the path of an executable that is available at the
   * job's execution host.   If  the  path  is  relative,  it  is
   * assumed to be relative to the working directory.
   * If working directory is not set,  the  path is assumed to be
   * relative to the user's home directory.
   *
   * The file pointed to by remoteCommand may either be an  executable
   * binary  or  an  executable script.  If a script, it
   * must include the path to the shell  in  a  #!  line  at  the
   * beginning  of  the  script.
   *
   * @example remoteCommand: "myTestScript.sh"
   * @type {!string}
   */
  this.remoteCommand = "";

  /**
   * Specifies the arguments to the job.
   *
   * @example args = ["foo", "bar", 2]
   * @type {Array}
   */
  this.args = [];

  /**
   * Specifies whether or not the job should be submitted as hold.
   * @type {boolean}
   */
  this.submitAsHold = false;

  /**
   * Specifies  the  job  environment.  Each  environment   value
   * defines  the  remote  environment.  The  value overrides the
   * remote environment values if there is a collision.
   * @example jobEnvironment: {a:20, b:40, c:"", d:null}
   * @type {Object}
   */
  this.jobEnvironment = {};

  /**
   * Specifies the directory name where the job will be executed.
   * If not set,  the  working directory will default to the
   * process' working directory.
   *
   * @example workingDirectory: "/path/to/working/directory/"
   * @type {string}
   */
  this.workingDirectory = "";

  /**
   * Specifies Sun Grid Engine native qsub options which  will
   * be  interpreted  as  part  of  the  DRMAA job template.
   * All options available to qsub command  may  be  used  in  the
   * native_specification,  except for -help, -sync, -t, -verify,
   * and -w.
   *
   * @example nativeSpecification: "-now y"
   * @type {string}
   */
  this.nativeSpecification = "";

  /**
   * Specifies e-mail addresses that are used to report  the  job
   * completion and status.
   *
   * @example email: ["john@doe.com", "foo@bar.com"]
   * @type {string[]}
   */
  this.email = [];

  /**
   * Specifies whether e-mail sending shall blocked or  not.
   * @type {boolean}
   */
  this.blockEmail = true;

  /**
   * Specifies the earliest time when the job may be eligible  to
   * be run.
   * The time format is [[CC]]YY]MMDDhhmm[.SS] where:
   * <ul>
   *  <li>CC is the first two digits of the year (century-1)</li>
   *  <li>YY is the last two digits of the year</li>
   *  <li>MM is the two digits of the month [01,12]</li>
   *  <li>DD is the two digit day of the month [01,31]</li>
   *  <li>hh is the two digit hour of the day [00,23]</li>
   *  <li>mm is the two digit minute of the day [00,59]</li>
   *  <li>SS is the two digit second of the minute [00,59]</li>
   * </ul>
   * Server's timezone is used.
   *
   * @example startTime: "201710061529" // October 6th, 2017, 15:29 local time
   * @type {string}
   */
  this.startTime = '';

  /**
   * Specifies the job's name. Setting the job name is equivalent
   * to using the qsub submit option '-N' followed by the job name.
   *
   * @example jobName: "myJobName"
   * @type {string}
   */
  this.jobName = "";

  /**
   * Specifies the standard input of the job.  Unless  set  elsewhere,
   * if not explicitly set in the job template, the job is
   * started with an empty input stream.
   *
   * @example inputPat: "/path/to/input/"
   * @type {string}
   */
  this.inputPath = "";

  /**
   * Specifies the standard output of the job. If not  explicitly
   * set in the job template, the whereabouts of the job's output
   * stream is not defined. If set, this attribute specifies  the
   * network path of the job's output stream file.
   *
   * @example inputPat: "/path/to/output/"
   * @type {string}
   */
  this.outputPath = "";

  /**
   * Specifies the standard error of the job. If  not  explicitly
   * set  in the job template, the whereabouts of the job's error
   * stream is not defined. If set, this attribute specifies  the
   * network path of the job's error stream file.
   *
   * @example inputPat: "/path/to/error/"
   * @type {string}
   */
  this.errorPath = "";

  /**
   * Specifies if the job's error  stream  should  be  intermixed
   * with  the  output  stream.  If not explicitly set in the job
   * template the attribute defaults to 'n'. Either  'y'  or  'n'
   * can  be  specified.
   * @type {string}
   */
  this.joinFiles = "";

  // Parses the input params if the class is instantiated by passing an object with corresponding values
  if (params) {
    for (var prop in params) {
      if (params.hasOwnProperty(prop) && this.hasOwnProperty(prop)) this[prop] = params[prop];else console.log("Ignoring property '" + prop + "' since it does not belong to JobTemplate.");
    }
  }
};

exports.default = JobTemplate;