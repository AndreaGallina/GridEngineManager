"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Exceptions = require("../Exceptions");

var Exception = _interopRequireWildcard(_Exceptions);

var _sgeCli = require("./sge-cli");

var sge = _interopRequireWildcard(_sgeCli);

var _Session2 = require("../Session");

var _Session3 = _interopRequireDefault(_Session2);

var _JobTemplate = require("../JobTemplate");

var _JobTemplate2 = _interopRequireDefault(_JobTemplate);

var _Job = require("../Job");

var _Job2 = _interopRequireDefault(_Job);

var _JobInfo = require("./JobInfo");

var _JobInfo2 = _interopRequireDefault(_JobInfo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _refreshInterval = 1000; // Refresh interval for the polling of completed jobs' information.
var _deletedJobs = []; // List of jobs that have been terminated using the control(..) API
var _jobs = {}; // Object containing the jobs submitted in this session, indexed by id


/**
 * @fileoverview Class that extends the abstract class Session, providing a DRMAA interface to Grid Engine.
 *
 * @author Andrea Gallina
 */

/**
 * Class that extends the abstract class Session, providing a DRMAA interface to Grid Engine.
 * @extends Session
 */

var SessionImpl = function (_Session) {
  _inherits(SessionImpl, _Session);

  /**
   * Create a SGE Session.
   * @param {string} sessionName - Name of the session
   * @param {JobMonitor} monitor - Reference to a job monitor
   * @param {?string} contact - Contact information
   */
  function SessionImpl(sessionName, monitor, contact) {
    _classCallCheck(this, SessionImpl);

    var _this = _possibleConstructorReturn(this, (SessionImpl.__proto__ || Object.getPrototypeOf(SessionImpl)).call(this));

    _this.sessionName = sessionName;
    _this.jobsMonitor = monitor;
    _this.contact = contact;
    return _this;
  }

  /**
   * Submits a Grid Engine job with attributes defined in the JobTemplate jobTemplate parameter.
   * @param {JobTemplate} jobTemplate   - Attributes of the job to be run.
   * @return {Promise} Promise resolving/rejecting as follows:
   * <ul>
   *    <li>
   *      <b>Resolve</b> {number} - The id of the job that was successfully submitted to SGE.
   *    </li>
   *    <li>
   *      <b>Reject</b> {[InvalidArgumentException]{@link module:nDrmaaExceptions.InvalidArgumentException}} - The
   *      jobTemplate specified is not an instance of class JobTemplate.
   *    </li>
   *    <li>
   *      <b>Reject</b> {*} - Any errors that might prevent job's submission in SGE.
   *    </li>
   * </ul>
   */


  _createClass(SessionImpl, [{
    key: "runJob",
    value: function runJob(jobTemplate) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {

        if (!(jobTemplate instanceof _JobTemplate2.default)) {
          reject(new Exception.InvalidArgumentException("Job Template must be an instance of JobTemplate"));
        }

        if (!jobTemplate.remoteCommand) reject(new Exception.InvalidArgumentException("Job template provided must contain at least the " + "'remoteCommand' property"));

        sge.qsub(jobTemplate).then(function (res) {
          var id = res.stdout.split(" ")[2];
          _jobs[id] = new _Job2.default(id, _this2.sessionName, jobTemplate);
          resolve(id);
        }, function (err) {
          reject(err);
        });
      });
    }

    /**
     * Submits a Grid Engine array job very much as if the qsub option `-t start-end:incr' had been used with the
     * corresponding attributes defined in the DRMAA JobTemplate.
     * The same constraints regarding qsub -t value ranges also apply to the parameters start, end, and incr.
     *
     * @param {JobTemplate} jobTemplate   - attributes of each job belonging to the array job to be run.
     * @param {number} start              - The starting value for the loop index
     * @param {?number} end                - The terminating value for the loop index
     * @param {?number} incr               - The value by which to increment the loop index each iteration
     * @return {Promise} Promise resolving/rejecting as follows:
     * <ul>
     *    <li>
     *      <b>Resolve</b> {number} - The id of the array job that was successfully submitted to SGE.
     *    </li>
     *    <li>
     *      <b>Reject</b> {[InvalidArgumentException]{@link module:nDrmaaExceptions.InvalidArgumentException}} - The
     *      jobTemplate specified is not an instance of class JobTemplate, or if any of the array job's indices are invalid.
     *    </li>
     *    <li>
     *      <b>Reject</b> {*} - Any errors that might prevent array job's submission in SGE.
     *    </li>
     * </ul>
     */

  }, {
    key: "runBulkJobs",
    value: function runBulkJobs(jobTemplate, start, end, incr) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (!(jobTemplate instanceof _JobTemplate2.default)) {
          reject(new Exception.InvalidArgumentException("Job Template must be an instance of JobTemplate"));
          return;
        }

        if (!jobTemplate.remoteCommand) reject(new Exception.InvalidArgumentException("Job template provided must contain at least the " + "'remoteCommand' property"));

        if (!start) reject(new Exception.InvalidArgumentException("Missing starting index for array job"));else if (start <= 0) reject(new Exception.InvalidArgumentException("Invalid start index: cannot be negative or zero."));else if (end && end <= 0) reject(new Exception.InvalidArgumentException("Invalid end index: cannot be negative or zero."));else if (incr && incr <= 0) reject(new Exception.InvalidArgumentException("Invalid increment index: cannot be negative or zero."));

        sge.qsub(jobTemplate, start, end, incr).then(function (res) {
          var id = res.stdout.split(" ")[2].split(".")[0];

          // Get the indices directly from the output of SGE, since using the ones passed upon method's invocation
          // would require some checks (e.g. check that start<end, check if a value for incr was passed etc)
          var jobArrInfo = {
            start: res.stdout.split(" ")[2].split(".")[1].split("-")[0],
            end: res.stdout.split(" ")[2].split(".")[1].split("-")[1].split(":")[0],
            incr: res.stdout.split(" ")[2].split(".")[1].split("-")[1].split(":")[1]
          };

          _jobs[id] = new _Job2.default(id, _this3.sessionName, jobTemplate, true, jobArrInfo.start, jobArrInfo.end, jobArrInfo.incr);

          resolve(id);
        }, function (err) {
          reject(err);
        });
      });
    }

    /**
     * Object describing the status of a task belonging to an array job.
     * @typedef {Object} TaskStatus
     * @property {string} mainStatus                       - The main status of a task of an array job.
     * @property {string} subStatus                        - The sub status of a task of an array job.
     */

    /**
     * Object describing the status of a single job.
     * @typedef {Object} JobStatus
     * @property {?string} mainStatus                       - The main status of a job.
     * @property {?string} subStatus                        - The sub status of a job.
     */

    /**
     * Object describing the global status of an array job along with the statuses of its tasks.
     * @typedef {Object} ArrayJobStatus
     * @property {string} mainStatus                       - The global main status of an array job.
     * @property {string} subStatus                        - The global sub status of an array job.
     * @property {Object.<number, TaskStatus>} tasksStatus - Object containing the status of each task of the
     *    array job, indexed by task id.
     */

    /**
     * Object that contains the status of a set of jobs, indexed by job id.
     * @typedef {Object.<number,(JobStatus|ArrayJobStatus)>} JobsStatus
     */

    /**
     * Get the program status of the job(s) specified in jobIds.
     *
     * The promise returned is resolved with a JSON object, indexed by id, describing the status of the job;
     * the object has the following structure:
     *
     * {
     *   {number} jobId1:
     *                    {
     *                      {string} mainStatus,
     *                      {string} subStatus
     *                    },
     *
     *   {number} jobId2:
     *                    {
     *                      {string} mainStatus,
     *                      {string} subStatus
     *                    },
     *
     *   {number} jobArrayId:
     *                    {
     *                      {string} mainStatus,
     *                      {string} subStatus,
     *                      {Object} tasksStatus :
     *                                            {
     *                                                {number} jobTaskId1:
     *                                                                    {
     *                                                                      {string} mainStatus,
     *                                                                      {string} subStatus
     *                                                                    },
     *
     *                                                {number} jobTaskId2:
     *                                                                    {
     *                                                                      {string} mainStatus,
     *                                                                      {string} subStatus
     *                                                                    },
     *                                                ...
     *                                                ...
     *                                            }
     *                    },
     *   ...
     *   ...
     *   ...
     * }
     *
     * where:
     * - jobId1, jobId2, ... jobIdN are the ids of each job for which the invoker wants to retrieve the status;
     * - jobArrayId is the result given by the method invocation on a job id that identifies a job array:
     *    the response objects for this kind of special jobs contains, other than the global status of the whole
     *    array job, another nested object, one for each job task belonging to the job array (identified by jobTaskId),
     *    specifying the status of each job's task.
     *
     * Each job (or task) has an object containing two properties: mainStatus and subStatus.
     * The subStatus property is used to better distinguish a job that has finished its execution.
     *
     *
     * The possible values for the mainStatus property are:
     * - UNDETERMINED: (only for array jobs) one or more job's tasks are either running, queued, on hold, or suspended.
     * - QUEUED: job is queued
     * - ON_HOLD: job is queued and on hold
     * - RUNNING: job is running
     * - SUSPENDED: job is suspended
     * - ERROR: job is in error state.
     * - COMPLETED: job has finished execution
     *
     * The possible values for the subStatus property are:
     * - null: the job's main status is not "COMPLETED"
     * - UNDETERMINED: job execution finished but status cannot be determined
     * - DONE: job execution finished normally
     * - FAILED: job execution finished, but failed.
     * - DELETED: job was deleted using the "control(..)" method
     *
     * @param {number[]} jobIds  - The id(s) of the job(s) whose status is to be retrieved
     * @return {Promise} Promise resolving/rejecting as follows:
     * <ul>
     *    <li>
     *      <b>Resolve</b> {{@link JobsStatus}} - Object containing the status of the specified jobs.
     *    </li>
     *    <li>
     *      <b>Reject</b> {[InvalidArgumentException]{@link module:nDrmaaExceptions.InvalidArgumentException}} - The
     *      jobIds array is either empty or is of wrong type, or the job ids specified do not exist in the current session.
     *    </li>
     *    <li>
     *      <b>Reject</b> {*} - Any errors that might prevent the retrieval of the jobs' status from SGE.
     *    </li>
     * </ul>
     */

  }, {
    key: "getJobProgramStatus",
    value: function getJobProgramStatus(jobIds) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        var jobsToQuery = []; // List of jobs to query
        var numJobsQueried = 0; // Number of jobs that have been queried successfully
        var jobsStatus = {}; // Object containing the status for each job with which we resolve the promise


        // ----- Arguments validation ----- //

        // If the argument passed is an array containing the jobs ids
        if (Array.isArray(jobIds)) jobsToQuery = jobIds; // Assign the job ids of the argument to the variable jobsToQuery

        // Otherwise, if the Session.JOB_IDS_SESSION_ALL constant has been passed as an argument
        else if (jobIds === _this4.JOB_IDS_SESSION_ALL) jobsToQuery = Object.keys(_jobs); // Assign all the jobs of this session to jobsToQuery

          // Lastly, the argument is invalid, hence throw an exception.
          else reject(new Exception.InvalidArgumentException("Invalid argument: argument must be either an array of job ids " + "or the special constant Session.JOB_IDS_SESSION_ALL"));

        // Assert that there's at least one job specified in the job ids array
        if (!jobIds || jobIds.length === 0) reject(new Exception.InvalidArgumentException("Empty jobs list: there must be at least one job in the list!"));

        // Assert that each job id passed as argument belongs to this session
        jobsToQuery.forEach(function (jobId) {
          if (!_jobs[jobId]) reject(new Exception.InvalidArgumentException("No jobs with id " + jobId + " were found in session " + _this4.sessionName));
        });

        // -------------------------------- //


        // Execute the qstat command, returning the list of jobs submitted to SGE
        sge.qstat().then(function (jobs) {

          // Iterate through each of the jobs to query
          jobsToQuery.forEach(function (jobId) {

            // Object describing the status of each job
            var jobStatus = {
              mainStatus: null,
              subStatus: null
            };

            // First, check if the job was deleted with the "control(..)" method
            if (_deletedJobs.includes(jobId)) {
              jobStatus.mainStatus = "COMPLETED";
              jobStatus.subStatus = "DELETED";

              jobsStatus[jobId] = jobStatus;

              numJobsQueried++;

              if (numJobsQueried === jobsToQuery.length)
                // Resolve the promise if we retrieved the status for all the jobs passed by the invoker
                resolve(jobsStatus);
            }

            // If the job was not deleted, check if we are dealing with a job array
            else if (_jobs[jobId]["isJobArray"]) {
                var completedTasks = [];
                var jobArray = _jobs[jobId];
                var start = jobArray.jobArrayStart,
                    end = jobArray.jobArrayEnd,
                    incr = jobArray.jobArrayIncr;

                jobsStatus[jobId] = {
                  mainStatus: null,
                  subStatus: null,
                  tasksStatus: {}
                };

                // Iterate over each array job's task to retrieve their status
                for (var taskId = start; taskId <= end; taskId += incr) {

                  // Object describing the status of each task belonging to the array job
                  var taskStatus = {
                    mainStatus: null,
                    subStatus: null
                  };

                  // The task appears on the list returned by qstat (hence not finished yet)
                  if (jobs[jobId] && jobs[jobId][taskId]) {
                    taskStatus.mainStatus = _parseJobStatus(jobs[jobId][taskId].jobState);
                  } else {
                    taskStatus.mainStatus = "COMPLETED";
                    completedTasks.push(taskId);
                  }

                  // Add an entry to the jobsStatus object for the jobId, containing the retrieved status
                  jobsStatus[jobId]['tasksStatus'][taskId] = taskStatus;
                }

                sge.qacct(jobId).then(function (jobInfo) {
                  completedTasks.forEach(function (taskId) {

                    if (jobInfo.notFound || !jobInfo[taskId]) jobsStatus[jobId]['tasksStatus'][taskId].subStatus = "UNDETERMINED";

                    // Job execution has finished but with failed status.
                    else if (jobInfo[taskId]["failed"] !== "0") jobsStatus[jobId]['tasksStatus'][taskId].subStatus = "FAILED";

                      // Job execution has finished successfully
                      else jobsStatus[jobId]['tasksStatus'][taskId].subStatus = "DONE";
                  });

                  // Determine the global job status according to its tasks' statuses.
                  jobStatus = _getArrayJobStatus(jobsStatus[jobId]['tasksStatus']);

                  jobsStatus[jobId]["mainStatus"] = jobStatus.mainStatus;
                  jobsStatus[jobId]["subStatus"] = jobStatus.subStatus;

                  // At this point, the status of all the job's tasks has been retrieved, hence
                  // we can increment the counter of the successfully queried jobs
                  numJobsQueried++;

                  if (numJobsQueried === jobsToQuery.length)
                    // Resolve the promise if we retrieved the status for all the jobs passed by the invoker
                    resolve(jobsStatus);
                }, function (err) {
                  reject(err);
                });
              }

              // If all previous checks failed, it means we are dealing with a single job
              else {

                  // The job appears on the list returned by qstat (hence not finished successfully/failed)
                  if (jobs[jobId]) {
                    jobStatus.mainStatus = _parseJobStatus(jobs[jobId].jobState);

                    // Add an entry to the jobsStatus object for the jobId, containing the retrieved status
                    jobsStatus[jobId] = jobStatus;

                    numJobsQueried++;

                    if (numJobsQueried === jobsToQuery.length)
                      // Resolve the promise if we retrieved the status for all the jobs passed by the invoker
                      resolve(jobsStatus);
                  }

                  // The job is not on the list returned by qstat, hence it must have finished execution successfully or failed.
                  // We thus have to use the qacct function to query the info of finished jobs.
                  else {
                      jobStatus.mainStatus = "COMPLETED";

                      sge.qacct(jobId).then(function (jobInfo) {
                        // Job execution has finished but its report has yet to show
                        // up on qacct, so its precise status can't be determined
                        if (jobInfo.notFound) jobStatus.subStatus = "UNDETERMINED";

                        // Job execution has finished but with failed status.
                        else if (jobInfo.failed !== "0") jobStatus.subStatus = "FAILED";

                          // Job execution has finished successfully
                          else jobStatus.subStatus = "DONE";

                        // Add an entry to the jobsStatus object for the jobId, containing the retrieved status
                        jobsStatus[jobId] = jobStatus;

                        numJobsQueried++;

                        if (numJobsQueried === jobsToQuery.length)
                          // Resolve the promise if we retrieved the status for all the jobs passed by the invoker
                          resolve(jobsStatus);
                      }, function (err) {
                        reject(err);
                      });
                    }
                }
          });
        }, function (err) {
          reject(err);
        });
      });
    }

    /**
     * An object containing the status of a completed job.
     * @typedef {Object} CompletedJobData
     * @property {number} jobId         - The id of the job
     * @property {string} msg           - A brief message with the job's status
     * @property {JobStatus} jobStatus  - The status of the completed job
     * @property {string[]} errors      - Error reasons if the job is in error status
     */

    /**
     * The synchronize() method returns when all jobs specified in jobIds have failed or finished
     * execution. If jobIds contains {@link JOB_IDS_SESSION_ALL}, then this method waits for all jobs submitted during this
     * DRMAA session.
     *
     * The caller may specify a timeout, indicating how many milliseconds to wait for this call to complete before
     * timing out. The special value {@link TIMEOUT_WAIT_FOREVER} can be used to wait indefinitely for a result.
     *
     * The promise returned is resolved a with an array of objects, one for each job specified upon method invocation,
     * indicating different information for each job; the array has the following structure:
     *
     * [
     *  {
     *      jobId: {string},
     *      msg: {string},
     *      jobStatus: {object},
     *      errors: {string}
     *  },
     *  {
     *    ..
     *    ..
     *    ..
     *  },
     *  ....
     * ]
     *
     * @param {(number[]|string)} jobIds  - The ids of the jobs to synchronize.
     * @param {?number} timeout            - The maximum number of milliseconds to wait for jobs' completion.
     * @return {Promise} Promise resolving/rejecting as follows:
     * <ul>
     *    <li>
     *      <b>Resolve</b> {Array.<{@link CompletedJobData}>} - Array containing the status of the completed jobs.
     *    </li>
     *    <li>
     *      <b>Reject</b> {[InvalidArgumentException]{@link module:nDrmaaExceptions.InvalidArgumentException}} - The
     *      jobIds array is either empty or is of wrong type.
     *    </li>
     *    <li>
     *      <b>Reject</b> {*} - Any errors that might prevent the retrieval of the jobs' status from SGE.
     *    </li>
     * </ul>
     */

  }, {
    key: "synchronize",
    value: function synchronize(jobIds, timeout) {
      var _this5 = this;

      timeout = timeout || this.TIMEOUT_WAIT_FOREVER; // If not specified, timeout is set to wait forever

      var hasTimeout = timeout !== this.TIMEOUT_WAIT_FOREVER; // Whether the caller specified a timeout
      var jobsToSync = []; // List of jobs (of class Job) to synchronize
      var completedJobs = []; // Array containing the response data of each completed job
      var numJobs = 0; // Number of jobs to synchronize

      return new Promise(function (resolve, reject) {
        // ------- Arguments validation ------ //
        // If the argument passed is an array containing the jobs ids
        if (Array.isArray(jobIds)) {
          // Add to jobsToSync the elements of class Job corresponding to the ids passed as argument.
          jobIds.forEach(function (jobId) {
            if (_jobs.hasOwnProperty(jobId)) jobsToSync.push(_jobs[jobId]);
          });
        }
        // Otherwise, if the Session.JOB_IDS_SESSION_ALL constant has been passed as an argument
        else if (jobIds === _this5.JOB_IDS_SESSION_ALL) {
            // Assign all the jobs of this session to jobsToSync
            for (var jobId in _jobs) {
              if (_jobs.hasOwnProperty(jobId)) jobsToSync.push(_jobs[jobId]);
            }
            // We assign all the ids of the current session's job, since this is used in the event listener callbacks.
            jobIds = Object.keys(_jobs);
          }
          // Lastly, the argument is invalid, hence throw an exception.
          else reject(new Exception.InvalidArgumentException("Invalid argument: argument must be either an array of job ids " + "or the special constant Session.JOB_IDS_SESSION_ALL"));

        if (!jobIds || jobIds.length === 0) reject(new Exception.InvalidArgumentException("Empty jobs list: there must be at least one job in the list!"));
        // -------------------------------- //

        numJobs = jobsToSync.length;

        var _self = _this5;

        // Listener callback function for the JobCompleted event.
        // Checks whether the JobCompleted event received concerns
        // one of the jobs that were registered for synchronization
        // in this session.
        function completedJobListener(jobId) {
          if (jobIds.includes(jobId)) {
            var wasDeleted = _deletedJobs.includes(jobId);
            var response = {
              jobId: jobId,
              msg: 'Job ' + jobId + ' completed',
              jobStatus: { mainStatus: "COMPLETED", subStatus: wasDeleted ? "DELETED" : "UNDETERMINED" },
              errors: null
            };

            // Push the object containing all the info about the job's status inside the array to return after all
            // jobs terminated their execution
            completedJobs.push(response);

            // If all jobs have terminated their execution, resolve the promise and stop the monitor
            if (completedJobs.length === numJobs) {
              _removeListeners(_self.jobsMonitor, completedJobListener, errorJobListener);
              resolve(completedJobs);
            }
          }
        }

        // Listener callback function for the JobError event.
        // Checks whether the JobError event received concerns
        // one of the jobs that were registered for synchronization
        // in this session.
        function errorJobListener(jobId) {
          if (jobIds.includes(jobId)) {
            sge.qstat(jobId).then(function (jobStats) {

              var wasDeleted = _deletedJobs.includes(jobId);
              var response = {
                jobId: jobId,
                msg: "Job " + jobId + " is in error state.",
                jobStatus: { mainStatus: "ERROR", subStatus: wasDeleted ? "DELETED" : "UNDETERMINED" },
                errors: jobStats["error_reason"]
              };

              completedJobs.push(response);

              if (completedJobs.length === numJobs) {
                _removeListeners(_self.jobsMonitor, completedJobListener, errorJobListener);
                resolve(completedJobs);
              }
            }, function (err) {
              _removeListeners(_self.jobsMonitor, completedJobListener, errorJobListener);
              reject(err);
            });
          }
        }

        // Registers all the jobs to synchronize in order to receive notification from
        // the monitor upon job's completion.
        _this5.jobsMonitor.registerJobs(jobsToSync);

        // Listener for JobCompleted events
        _this5.jobsMonitor.on("JobCompleted", completedJobListener);

        // Listener for JobError events
        _this5.jobsMonitor.on("JobError", errorJobListener);

        _this5.jobsMonitor.on("qstatError", function (err) {
          _removeListeners(_self.jobsMonitor, completedJobListener, errorJobListener);
          _self.jobsMonitor.removeListener("qstatError", this);
          reject(err);
        });

        if (hasTimeout) {
          // Rejects the promise after timeout has expired and remove registered listeners.
          setTimeout(function () {
            try {
              _removeListeners(_self.jobsMonitor, completedJobListener, errorJobListener);
              reject(new Exception.ExitTimeoutException("Timeout expired before job completion"));
            } catch (e) {}
          }, timeout);
        }
      });
    }

    /**
     * Wait until a job is complete and the information regarding the job's execution are available.
     * Whether the job completes successfully or with a failure status, returns the job information using the command "qacct";
     * otherwise if there's an error preventing the job from completing, returns the job information retrieved with the
     * command "qstat" in order to be able to access the error reasons.
     *
     * The caller may use timeout, specifying how many milliseconds to wait for this call to complete before timing out.
     * The special value TIMEOUT_WAIT_FOREVER can be uesd to wait indefinitely for a result.
     *
     * @param {number} jobId              - The id of the job for which to wait
     * @param {?number} timeout            - Maximum amount of milliseconds to wait for job's completion.
     * @return {Promise} Promise resolving/rejecting as follows:
     * <ul>
     *    <li>
     *      <b>Resolve</b> {{@link JobInfo}} - The information of the completed job.
     *    </li>
     *    <li>
     *      <b>Reject</b> {[InvalidArgumentException]{@link module:nDrmaaExceptions.InvalidArgumentException}} - The job
     *      id provided does not exist in the current session.
     *    </li>
     *    <li>
     *      <b>Reject</b> {*} - Any errors that might prevent the retrieval of the job's information from SGE.
     *    </li>
     * </ul>
     */

  }, {
    key: "wait",
    value: function wait(jobId, timeout) {
      var _this6 = this;

      timeout = timeout || this.TIMEOUT_WAIT_FOREVER;

      var hasTimeout = timeout !== this.TIMEOUT_WAIT_FOREVER;

      return new Promise(function (resolve, reject) {
        // ------- ARGUMENTS VALIDATION ------ //
        if (isNaN(jobId)) reject(new Exception.InvalidArgumentException("Job id must be a valid number!"));
        if (!_jobs[jobId]) reject(new Exception.InvalidArgumentException("No jobs with id " + jobId + " were found in session " + _this6.sessionName));
        // ----------------------------------- //


        var job = _jobs[jobId];
        var isArrayJob = job["isJobArray"];
        // If we are dealing with an array job, calculate the number of tasks that the job is composed of.
        var numTasksAJ = isArrayJob ? Math.ceil((job["jobArrayEnd"] - job["jobArrayStart"] + 1) / job["jobArrayIncr"]) : null;
        // If the array job has only one task, then treat it as a single job.
        isArrayJob = numTasksAJ > 1;

        _this6.synchronize([jobId], timeout).then(function (response) {
          var jobState = response[0].jobStatus;

          if (jobState.mainStatus === "COMPLETED" || jobState.mainStatus === "ERROR") {

            // Job has completed its execution and its info are available on qacct
            if (jobState.mainStatus === "COMPLETED" && (jobState.subStatus === "DONE" || jobState.subStatus === "FAILED")) {
              sge.qacct(jobId).then(function (jobInfo) {
                resolve(new _JobInfo2.default(jobInfo));
              }, function (err) {
                reject(err);
              });
            }

            // Job has completed its execution (or is in "ERROR" state) but its info are NOT yet available on qacct
            else {
                var monitor = setInterval(function () {
                  sge.qacct(jobId).then(function (jobInfo) {

                    // Job information available on qacct.
                    if (!jobInfo.notFound) {

                      // If we are dealing with an array job, make sure that qacct returned the information
                      // for all the job's tasks, otherwise we need to do some more polling.
                      if (!isArrayJob || isArrayJob && (Object.keys(jobInfo).length === numTasksAJ || _deletedJobs.includes(jobId))) {

                        // Stop the monitor and resolve the promise with the job's info if all the info regarding
                        // this job (or array job's tasks) were retrieved from qacct
                        clearInterval(monitor);
                        var toReturn = new _JobInfo2.default(jobInfo); // Job info to return
                        // If job is in error state, add the error reasons returned by synchronize.
                        if (jobState.mainStatus === "ERROR") toReturn.errors = response[0].errors;
                        resolve(toReturn);
                      }
                    }
                  }, function (err) {
                    reject(err);
                  });
                }, _refreshInterval);

                if (hasTimeout) {
                  // Stop the monitor and reject the promise if timeout expires.
                  setTimeout(function () {
                    clearInterval(monitor);

                    try {
                      reject(new Exception.ExitTimeoutException("Timeout expired before job completion"));
                    } catch (e) {}
                  }, timeout);
                }
              }
          }
        }, function (err) {
          reject(err);
        });
      });
    }

    /**
     * Response to a call to Session.control() method.
     * @typedef {Object} ActionResponse
     * @property {number} jobId - Id of the job upon which the action has been called.
     * @property {string} data - The response of SGE after the action was submitted.
     * @property {number} action - Code that identifies the action specified taken.
     * @property {?string} error - Error given by a unsuccessful call to the function performing the desired action
     */

    /**
     * Hold, release, suspend, resume, or kill the job identified by jobId.
     * If jobId is JOB_IDS_SESSION_ALL, then this routine acts on all jobs submitted during this DRMAA session up to
     * the moment control() is called.
     *
     * The legal values for action and their meanings are:
     *  - SUSPEND: stop the job,
     *  - RESUME: (re)start the job,
     *  - HOLD: put the job on-hold,
     *  - RELEASE: release the hold on the job,
     *  - TERMINATE: kill the job.
     *
     * This routine returns once the action has been acknowledged by the DRM system, but does not wait
     * until the action has been completed.
     *
     * The promise returned is resolved with an array of objects, one for each jobs on which the action is performed,
     * with the following properties:
     *
     * {
     *   jobId: the id of the job
     *   response: the response given by a successful call to the function performing the desired action
     *   action: code that identifies the action taken
     *   error: the error given by a unsuccessful call to the function performing the desired action
     * }
     *
     * @param {number|string} jobId  - The id of the job to control, or the constant "JOB_IDS_SESSION_ALL"
     * @param {string} action - The control action to be taken
     * @return {Promise} Promise resolving/rejecting as follows:
     * <ul>
     *    <li>
     *      <b>Resolve</b> {Array.<{@link ActionResponse}>} - The response to the action taken on the specified job(s).
     *    </li>
     *    <li>
     *      <b>Reject</b> {[InvalidArgumentException]{@link module:nDrmaaExceptions.InvalidArgumentException}} - An
     *      invalid action or job id was passed.
     *    </li>
     *    <li>
     *      <b>Reject</b> {*} - Any errors that SGE might return when trying to perform the action.
     *    </li>
     * </ul>
     */

  }, {
    key: "control",
    value: function control(jobId, action) {
      var _this7 = this;

      return new Promise(function (resolve, reject) {
        // Array with the ids of the jobs to control: if JOB_IDS_SESSION_ALL is passed then it will contain all the jobs
        // submitted during this session.
        var jobsList = jobId === _this7.JOB_IDS_SESSION_ALL ? Object.keys(_jobs) : [jobId];

        // Container for the response objects of each job that will be used to resolve the promise.
        var response = [];

        // Template for the response of each call to the desired action on each job
        var actionResponse = {
          jobId: null,
          data: null,
          action: null,
          error: null
        };

        // Check the action's validity
        if (action !== _this7.SUSPEND && action !== _this7.RESUME && action !== _this7.HOLD && action !== _this7.RELEASE && action !== _this7.TERMINATE) {
          reject(new Exception.InvalidArgumentException("Invalid action: " + action));
        }

        // Iterate through the list of jobs and perform the action on each job

        var _loop = function _loop(i) {
          var jobId = jobsList[i];

          if (!_jobs[jobId]) {
            reject(new Exception.InvalidArgumentException("No jobs with id " + jobId + " were found in session " + _this7.sessionName));
            return "break";
          }

          sge.control(jobId, action).then(function (res) {

            actionResponse.jobId = jobId;
            actionResponse.data = res;
            actionResponse.action = action;

            response.push(actionResponse);

            // If we are deleting a job, push the job id in the list of deleted jobs
            if (action === _this7.TERMINATE) _deletedJobs.push(jobId);

            // Action was performed on all jobs => resolve
            if (response.length === jobsList.length) resolve(response);
          }, function (err) {

            actionResponse.jobId = jobId;
            actionResponse.error = err;

            response.push(actionResponse);

            // Action was performed on all jobs => resolve
            if (response.length === jobsList.length) resolve(response);
          });
        };

        for (var i = 0; i < jobsList.length; i++) {
          var _ret = _loop(i);

          if (_ret === "break") break;
        }
      });
    }
  }]);

  return SessionImpl;
}(_Session3.default);

// --------- HELPER METHODS --------- //

/**
 * Helper method for parsing a job's status starting from the letters displayed in "qstat" result.
 * @param {string} jobStatus  - The status of a job retrieved from SGE with the command "qstat".
 * @returns {string}          - one of the following extended statuses: QUEUED, ON_HOLD, RUNNING, SUSPENDED, ERROR
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
 * Helper method for retrieving the global status of an array job based on its tasks' statuses.
 *
 * The returned global job status can have the following values:
 *
 * - mainStatus:
 *   - COMPLETED: if all the job's tasks mainStatus property is equal to COMPLETED
 *   - ERROR: if at least one sub task mainStatus property is equal to ERROR
 *   - UNDETERMINED: if there are no sub tasks in ERROR status and at least one sub task mainStatus is != COMPLETED
 *                  (i.e. if the job's tasks are still running and none of them encountered errors, then we assign
 *                  this value)
 *
 * - subStatus:
 *   - UNDETERMINED: if the global status' main status is COMPLETE and at least one task's subStatus property is UNDETERMINED
 *   - FAILED: if the global status' main status is COMPLETE and at least one task's subStatus property is FAILED
 *   - DONE: if the global status' main status is COMPLETE and all the sub tasks' subStatus is DONE
 *
 * @param {Object.<number, TaskStatus>} jobTasks - Object containing the status of all the tasks of an array job.
 * @returns {JobStatus} - Global status of the array job.
 * @private
 */
function _getArrayJobStatus(jobTasks) {

  var globalStatus = {
    mainStatus: null,
    subStatus: null
  };

  for (var taskId in jobTasks) {
    if (jobTasks.hasOwnProperty(taskId)) {
      if (jobTasks[taskId]["mainStatus"] === "ERROR") {
        globalStatus.mainStatus = "ERROR";
        break;
      } else if (jobTasks[taskId]["mainStatus"] !== "COMPLETED") {
        globalStatus.mainStatus = "UNDETERMINED";
        break;
      }
    }
  }

  if (!globalStatus.mainStatus) {
    globalStatus.mainStatus = "COMPLETED";
    for (var _taskId in jobTasks) {
      if (jobTasks.hasOwnProperty(_taskId)) {
        if (jobTasks[_taskId]["subStatus"] === "FAILED") {
          globalStatus.subStatus = "FAILED";
          break;
        } else if (jobTasks[_taskId]["subStatus"] === "UNDETERMINED") {
          globalStatus.subStatus = "UNDETERMINED";
          break;
        }
      }
    }

    if (!globalStatus.subStatus) globalStatus.subStatus = "DONE";
  }

  return globalStatus;
}

/**
 * Wrapper function for removing the listeners from an element of class JobMonitor.
 * @param jobMonitor
 * @param {callback} completedListener
 * @param {callback} errorListener
 * @private
 */
function _removeListeners(jobMonitor, completedListener, errorListener) {
  jobMonitor.removeListener("JobCompleted", completedListener);
  jobMonitor.removeListener("JobError", errorListener);
}

exports.default = SessionImpl;