"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDrmsInfo = getDrmsInfo;
exports.qstat = qstat;
exports.qsub = qsub;
exports.qacct = qacct;
exports.control = control;

var _child_process = require("child_process");

var _Version = require("../Version");

var _Version2 = _interopRequireDefault(_Version);

var _Exceptions = require("../Exceptions");

var Exception = _interopRequireWildcard(_Exceptions);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @fileoverview Module that provides a set of functions to interact with Grid Engine through CLI
 *
 * @author Andrea Gallina
 */

/**
 * Module that provides a set of functions to interact with Grid Engine through CLI
 * @module sge-cli
 */

/**
 * Object containing the name and version of SGE
 * @typedef {Object} DrmsInfo
 * @property {string} drmsName - The name of the DRMS
 * @property {Version} version - Version of DRMS in use.
 */

/**
 * Get SGE version.
 * @return {Promise}
 * <ul>
 *    <li>
 *      <b>Resolve</b> {{@link DrmsInfo}} - The name and the version of SGE.
 *    </li>
 *    <li>
 *      <b>Reject</b> {*} - Any error that might prevent communication with SGE.
 *    </li>
 * </ul>
 */
function getDrmsInfo() {
  return new Promise(function (resolve, reject) {
    // First, check if SGE is up and running
    (0, _child_process.exec)("qhost", function (err) {
      if (err) {
        reject(err);
        return;
      }
      // If it's good, retrieve the version of the DRMS
      (0, _child_process.exec)("qstat -help", function (err, stdout) {
        if (err) {
          reject(err);
          return;
        }
        var data = stdout.split("\n")[0].split(" "); // The first line is the one containing the SGE version.
        var res = { drmsName: data[0] }; // DRM name (SGE in this case)
        var vparts = data[1].split("."); // Split into major and minor version number
        res.version = new _Version2.default(vparts[0], vparts[1]);
        resolve(res);
      });
    });
  });
}

/**
 * Function for invoking the qstat command of SGE.
 * @param {?(string|number)} jobId - id of the job on which qstat will be called
 * @return {Promise}
 * <ul>
 *    <li>
 *      <b>Resolve</b> {Object} - Different possible results based on the kind of job specified (if any).
 *        (See "APIResponseExamples.txt" document for output format)
 *    </li>
 *    <li>
 *      <b>Reject</b> {*} - Any error that might prevent retrieving jobs' status from SGE.
 *    </li>
 * </ul>
 */
function qstat(jobId) {
  return new Promise(function (resolve, reject) {
    var args = [];

    if (jobId) args.push("-j", jobId);

    // With "-g d", array jobs' tasks are displayed verbosely in a one
    // line per job task fashion.
    args.push("-g", "d");

    var qstat = (0, _child_process.spawn)("qstat", args);
    var stdout = "",
        stderr = "";

    qstat.stdout.on('data', function (data) {
      stdout += data;
    });

    qstat.stderr.on('data', function (data) {
      stderr += data;
    });

    qstat.on('error', function (err) {
      reject(err);
    });

    qstat.on('close', function () {
      var isSingleJobResult = !!jobId; // If qstat() is called with no parameters, equals to false

      var res = _parseQstatResult(stdout, isSingleJobResult);

      resolve(res);
    });
  });
}

/**
 * Function for invoking the qsub command of SGE.
 * @param {JobTemplate} jobTemplate - Contains job's parameters. See {@link JobTemplate} class
 * @param {?number} start - Starting index of a job array
 * @param {?number} end - Final index of a job array
 * @param {?number} incr - Increment index of a job array
 * @return {Promise}
 * <ul>
 *    <li>
 *      <b>Resolve</b> {Object} - Contains the stdout and stderr of the command execution
 *    </li>
 *    <li>
 *      <b>Reject</b> {*} - Any error that may prevent the submission of a job.
 *    </li>
 * </ul>
 */
function qsub(jobTemplate, start, end, incr) {
  return new Promise(function (resolve, reject) {
    // Options for the exec function; set the working directory specified in the jobTemplate.
    var opts = {
      cwd: jobTemplate.workingDirectory
    };
    var args = _parseQsubOptions(jobTemplate);

    // The user wants to run an array job
    if (start) args += " -t " + start + (end ? "-" + end + (incr ? ":" + incr : "") : "");

    var command = "qsub " + args + " " + jobTemplate.remoteCommand + " " + jobTemplate.args.join(" ");

    // console.log("Executing command: " + command);

    (0, _child_process.exec)(command, opts, function (err, stdout, stderr) {
      if (err) {
        reject({ stderr: stderr, err: err });
        return;
      }
      resolve({ stdout: stdout, stderr: stderr });
    });
  });
}

/**
 * Function for invoking the qacct command of SGE.
 * @param {(string|number)} jobId - Id of the completed job for which we want to retrieve information.
 * @return {Promise}
 * <ul>
 *   <li>
 *      <b>Resolve</b> {Object} - Contains the detailed information of a completed job.
 *        (See "APIResponseExamples.txt" document for output format)
 *   </li>
 *   <li>
 *      <b>Reject</b> {*} - Any error that might prevent retrieving data about a completed job.
 *   </li>
 * </ul>
 */
function qacct(jobId) {
  return new Promise(function (resolve, reject) {
    var args = ["-j", jobId];

    var command = "qacct";

    // console.log("Executing command: " + command);

    var qacct = (0, _child_process.spawn)(command, args);

    var stdout = "",
        stderr = "";

    qacct.stdout.on('data', function (data) {
      stdout += data;
    });

    qacct.stderr.on('data', function (data) {
      stderr += data;
    });

    qacct.on('error', function (err) {
      reject(err);
    });

    qacct.on('close', function () {
      if (stderr) {
        if (stderr.includes("not found")) {
          resolve({ jobId: jobId, notFound: true });
        } else reject(stderr);
      } else {
        // Parse the result in a JSON object
        var res = _parseQacctResult(stdout);
        resolve(res);
      }
    });
  });
}

/**
 * Function for controlling a job that's being executed by SGE.
 * @param {(string[]|number[]|string)} jobIds - Id(s) of the job(s) to control
 * @param {string} action - Action to undertake
 * @return {Promise}
 * <ul>
 *   <li>
 *      <b>Resolve</b> {string} - Standard output of the command execution.
 *   </li>
 *   <li>
 *      <b>Reject</b> {*} - Any error that might prevent the execution of the command.
 *   </li>
 * </ul>
 */
function control(jobIds, action) {
  return new Promise(function (resolve, reject) {
    var SUSPEND = 0,
        RESUME = 1,
        HOLD = 2,
        RELEASE = 3,
        TERMINATE = 4;

    jobIds = jobIds && typeof jobIds === 'string' ? jobIds : jobIds.join(",");

    var command = "";

    switch (action) {
      case SUSPEND:
        command = "qmod -sj " + jobIds;
        break;

      case RESUME:
        command = "qmod -usj " + jobIds;
        break;

      case HOLD:
        command = "qhold " + jobIds;
        break;

      case RELEASE:
        command = "qrls " + jobIds;
        break;

      case TERMINATE:
        command = "qdel " + jobIds;
        break;
    }

    (0, _child_process.exec)(command, function (err, stdout) {
      if (err) {
        reject(err + stdout);return;
      }

      resolve(stdout);
    });
  });
}

/** ------------ HELPER METHODS -------------- **/

/**
 * Parses the options and arguments included in a jobTemplate.
 * @param {JobTemplate} jobTemplate
 * @returns {string} - The string with the specified options formatted s.t. they can be parsed by SGE.
 * @private
 */
function _parseQsubOptions(jobTemplate) {
  var opts = [];
  Object.keys(jobTemplate).forEach(function (key) {
    if (!jobTemplate[key] || Object.keys(jobTemplate[key]).length === 0 && jobTemplate[key].constructor === Object) {
      return;
    }

    switch (key) {
      case "workingDirectory":
        opts.push("-cwd");
        break;

      case "submitAsHold":
        opts.push("-h");
        break;

      case "jobEnvironment":
        opts.push("-v");
        var temp = [];
        Object.keys(jobTemplate[key]).forEach(function (envvar) {
          if (jobTemplate[key][envvar]) temp.push(envvar + "=" + jobTemplate[key][envvar]);else temp.push(envvar);
        });
        opts.push(temp.join(","));
        break;

      case "email":
        if (jobTemplate[key].length !== 0) {
          opts.push("-M ");
          var _temp = [];
          jobTemplate[key].forEach(function (addr) {
            _temp.push(addr);
          });
          opts.push(_temp.join(","));
        }
        break;

      case "blockEmail":
        opts.push("-m");
        opts.push("n");
        break;

      case "jobName":
        opts.push("-N");
        opts.push(jobTemplate[key]);
        break;

      case "inputPath":
        opts.push("-i");
        opts.push(jobTemplate[key]);
        break;

      case "outputPath":
        opts.push("-o");
        opts.push(jobTemplate[key]);
        break;

      case "errorPath":
        opts.push("-e");
        opts.push(jobTemplate[key]);
        break;

      case "joinFiles":
        opts.push("-j");
        break;

      case "remoteCommand":
      case "args":
        break;

      case "startTime":
        opts.push("-a");
        opts.push(jobTemplate[key]);
        break;

      case "nativeSpecification":
        jobTemplate[key].split(" ").forEach(function (i) {
          // These attributes are not supported in the DRMAA.
          if (i === "-help" || i === "-sync" || i === "-t" || i === "-verify" || i === "-w") throw new Exception.UnsupportedAttributeException("The attribute " + i + " is not supported");else opts.push(i);
        });
        break;

      default:
        console.log("Ignoring Template Property: ", key);
    }
  });

  // console.log("opts: " + opts);

  return opts.join(" ");
}

/**
 * Parses the result of a qstat function invocation.
 * @param {string} result - The result of the qstat command
 * @param {boolean} isSingleJobResult - whether the qacct command was called with the flag -j specifying a job id
 * @returns {Object} - The parsed result
 * @private
 */
function _parseQstatResult(result, isSingleJobResult) {
  var jobs = {};
  if (!isSingleJobResult) {
    // split the output in lines, omitting the first two since they carry no information, and remove the empty lines.
    var lines = result.split("\n").slice(2).filter(function (line) {
      return line !== "";
    });
    lines.forEach(function (line) {
      var prop = line.split(" ").filter(function (word) {
        return word !== "";
      });

      // Check if the current line describes a job array task. This is done by checking
      // whether the last two elements of the line are numbers (the last two elements
      // refer to the "slots" and "ja-task-ID" properties in the output of qstat)
      // This nasty trick is necessary since the "queue" property is not always present (e.g.
      // when the job is waiting to be scheduled to a queue), hence the
      // position of the "ja-task-ID" property in our array is not fixed
      var isJobArray = !isNaN(prop[prop.length - 1]) && !isNaN(prop[prop.length - 2]);

      var jobInfo = {
        jobId: prop[0],
        jobPriority: prop[1],
        jobName: prop[2],
        jobOwner: prop[3],
        jobState: prop[4],
        submitDate: prop[5] + " " + prop[6],
        jobQueue: isNaN(prop[7]) ? prop[7] : null,
        jobSlots: isNaN(prop[7]) ? prop[8] : prop[7]
      };

      if (isJobArray) {
        var taskId = prop[prop.length - 1]; // The last element indicates the job array task id
        if (!jobs[prop[0]]) jobs[prop[0]] = {}; // Initialize the object if needed
        jobs[prop[0]][taskId] = jobInfo;
      } else jobs[prop[0]] = jobInfo;
    });
  } else {
    var job = {};
    var _lines = result.split("\n").slice(1).filter(function (line) {
      return line !== "";
    });
    _lines.forEach(function (line) {
      var key = line.split(":", 1)[0];
      var value = line.slice(key.length + 1).trim();

      // Group together multiple error reasons (normally they would be listed as "error reason 1", "error reason 2" etc)
      if (key.includes("error reason")) {
        key = "error_reason";
        if (job[key]) job[key].push(value);else job[key] = [value];
      } else job[key] = value;
    });

    jobs = job;
  }
  // console.log(jobs);
  return jobs;
}

/**
 * Parses the result of a qacct function invocation.
 * @param {string} result - the result of the qacct command
 * @returns {Object} - The parsed result
 * @private
 */
function _parseQacctResult(result) {
  var jobInfo = {};

  // Divide the output by task id, in order to handle array jobs.
  // If we are not dealing with the output of an array job, jobTasks will contain only one element
  var jobTasks = result.split("==============================================================").filter(function (line) {
    return line !== "";
  });

  // If we are dealing with the output of an array job
  if (jobTasks.length > 1) {
    jobTasks.forEach(function (jobTask) {
      var taskInfo = {};
      var lines = jobTask.split("\n").filter(function (line) {
        return line !== "";
      });
      lines.forEach(function (line) {
        var key = line.split(" ", 1)[0];
        taskInfo[key] = line.slice(key.length).trim();
      });
      jobInfo[taskInfo.taskid] = taskInfo;
    });
  }

  // Otherwise we are dealing with the output of a single job
  else {
      var lines = result.split("\n").slice(1).filter(function (line) {
        return line !== "";
      });
      lines.forEach(function (line) {
        var key = line.split(" ", 1)[0];
        jobInfo[key] = line.slice(key.length).trim();
      });
    }

  return jobInfo;
}