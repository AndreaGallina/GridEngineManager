'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * @fileoverview Collection of functions used to monitor the user array and the
                                                                                                                                                                                                                                                                               * status of submitted jobs, in order to take appropriate action if necessary.
                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                               * @author Marco Speronello
                                                                                                                                                                                                                                                                               */

exports.monitorUsers = monitorUsers;
exports.monitorJob = monitorJob;

var _schedulerManager = require('./scheduler-manager');

/** @module scheduler/monitors */

/**
 * Scans the users array and removes users which have been inactive (i.e. have
 * not made a request) for longer than the maximum allotted time
 * ([userLifespan]{@link scheduler/schedulerManager#userLifespan}).
 */
function monitorUsers(scheduler) {
  var currentTime = new Date().getTime();
  for (var i = scheduler.users.length - 1; i >= 0; i--) {
    if (currentTime - scheduler.users[i].requests[scheduler.users[i].requests.length - 1] > scheduler.userLifespan) {
      console.log('Removing user ' + scheduler.users[i].ip + ' from history. The user has been inactive for longer than the maximum allotted time.');
      scheduler.users.splice(i, 1);
    }
  }
}

/**
 * Relevant information regarding the status of a job already submitted, but not
 * necessarily completed, to the SGE.
 * @typedef {Object} jobStatusInformation
 * @property {number} jobId - The id of the job.
 * @property {string} jobName - The name of the job.
 * @param {string} sessionName - The UUID of the {@link Session} the job was
 * launched in.
 * @property {string} mainStatus - The main status of the job as specified in
 * {@link Session}.
 * @property {string} subStatus - The sub status of the job as specified in
 * {@link Session}.
 * @property {number} exitStatus - The exit code of the job, returned by the
 * SGE.
 * @property {string} failed - The reason why the job execution failed, if any,
 * returned by the SGE.
 * @property {string} errors - Possible errors, returned by the SGE.
 * @property {string} description - A brief description of what is
 * happening/happened to the job.
 */

/**
 * Relevant information regarding the failure to read the status of a job.
 * @typedef {Object} jobStatusError
 * @property {string} monitoringError - A statement to inform the user of this
 * object that an error occurred during the monitoring process.
 * @property {string} errors - The dump of the error.
 */

/**
 * Monitors the status of the job whose index is specified by the jobId
 * parameter. The status is checked after a set amount of time, specified by the
 * [jobPollingInterval]{@link scheduler/schedulerManager#jobPollingInterval}
 * parameter, has passed.<br>
 * The promise returned by the function is resolved once a job is in a COMPLETED
 * or ERROR state, otherwise it is rejected.
 *
 * @param {number} jobId - The id of the job to monitor.
 * @param {SchedulerManager} scheduler - The scheduler that monitors this job.
 * @param {Session} session - The name of the session the job belongs to.
 * @returns {Promise}
 * <ul>
 *    <li>
 *      <b>Resolve</b> {[jobStatusInformation]{@link
 *      module:scheduler/monitors~jobStatusInformation}} - Object holding
 *      information regarding status of the job currently being handled by the
 *      SGE.
 *    </li>
 *    <li>
 *      <b>Reject</b> {[jobStatusError]{@link
 *      module:scheduler/monitors~jobStatusError}} - Object holding
 *      information regarding the failure to read the status of the job.
 *    </li>
 * </ul>
 * Note: the exitStatus, failed and errors fields are always null if the job was
 * terminated while !RUNNING (i.e. while QUEUED/ON_HOLD).
 */
function monitorJob(jobId, scheduler, session) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      // Keeps checking the status of the job until it is completed or an
      // error occurs.
      pollJob(jobId, scheduler, session).then(function (status) {
        // The job is not COMPLETED or in ERROR, the function is called
        // again after the specified time.
        if (status.mainStatus !== 'COMPLETED' && status.mainStatus !== 'ERROR') {
          // console.log('not yet completed');
          reject(status);
        } else {
          console.log('RESOLVING');
          resolve(status);
        }
      }, function (error) {
        console.log('Error reading status for job ' + jobId + ': ' + error);
        reject({
          monitoringError: 'Error reading status for job ' + jobId + '.',
          errors: error
        });
      });
    }, scheduler.jobPollingInterval);
  });
}

/**
 * Queries the SGE to monitor the status of the specified job. The promise
 * returned is resolved if the status of the job is read successfully, otherwise
 * it is rejected.
 *
 * @param {number} jobId - The id of the job to monitor.
 * @param {Session} session - The name of the session the job belongs to.
 * @returns {Promise}
 * <ul>
 *    <li>
 *      <b>Resolve</b> {[jobStatusInformation]{@link
 *      module:scheduler/monitors~jobStatusInformation}} - Object holding
 *      information regarding status of the job currently being handled by the
 *      SGE.
 *    </li>
 *    <li>
 *      <b>Reject</b> {string} - A dump of the error if the status of the job
 *      could not be read.
 *    </li>
 * </ul>
 */
function pollJob(jobId, scheduler, session) {
  return new Promise(function (resolve, reject) {
    try {
      // Name and type of the job.
      var jobName = scheduler.jobs_[jobId].jobName;
      var jobType = scheduler.jobs_[jobId].jobType;

      // Fetches the status of the specified job and verifies if any meaningful
      // changes to the status of the job took place or any timeouts have been
      // violated since the previous check. The function used to do so depends
      // on whether the JOB_TYPE of the job is SINGLE or ARRAY.
      // The JSON object containing several job information is used to resolve
      // the promise.
      session.getJobProgramStatus([jobId]).then(function (jobStatus) {
        if (jobType === _schedulerManager.JOB_TYPE.SINGLE) {
          monitorSingleJob(session, scheduler, jobStatus, jobId).then(function (result) {
            resolve(result);
          }, function (error) {
            reject(error);
          });
        } else {
          monitorArrayJob(session, scheduler, jobStatus, jobId).then(function (result) {
            resolve(result);
          }, function (error) {
            reject(error);
          });
        }
      }, function (error) {
        console.log('Error reading status for job ' + jobId + ' (' + jobName + ').');
        reject(error);
      });
    } catch (error) {
      console.log('Error reading status for job ' + jobId + '.');
      reject(error);
    }
  });
}

/**
 * Compares the current status of the job (of {@link JOB_TYPE}.SINGLE) specified
 * by the index parameter to the one stored in the job history (hence memorized
 * during the previous call of this function or, if the function has not been
 * called before, after the job was submitted) for this job and takes
 * appropriate action if necessary.<br>
 * The events which are checked and the resulting actions are the following:
 * <br><br>
 *
 * (1) the job went from !RUNNING to RUNNING since the previous check --> the
 * submitDate field of the job is updated to the current time to to represent
 * the approximate time at which the job switched from to RUNNING;<br>
 * (2) the job is in ERROR state --> the job is forcibly terminated and deleted
 * from history;<br>
 * (3) the job was !RUNNING, is still !RUNNING and the time limit for !RUNNING
 * jobs ([maxJobQueuedTime_]{@link
 * scheduler/schedulerManager#maxJobQueuedTime_}) has been exceeded --> the job
 * is forcibly terminated and deleted from history;<br>
 * (4) the job was RUNNING, is still RUNNING and the time limit for RUNNING jobs
 * ([maxJobRunningTime_]{@link scheduler/schedulerManager#maxJobRunningTime_})
 * has been exceeded --> the job is forcibly terminated and deleted from
 * history;<br>
 * (5) the job was !COMPLETED and is now COMPLETED --> the job is deleted from
 * history.<br><br>
 *
 * Note: the submitDate field of the job is used to verify whether any timeouts
 * were hit (points (3) and (4)).<br>
 * Note: given the asynchronicity of this function and the ones which call it,
 * the updated submitDate field (point (1)) is subjected to unavoidable
 * approximations, whose precision is inversely proportional to the time
 * interval between two subsequent calls of this function (regulated by the
 * [jobPollingInterval]{@link scheduler/schedulerManager#jobPollingInterval}
 * parameter).<br><br>
 *
 * The promise always resolves unless an error occurs.
 *
 * @param {Session} session - The name of the session the job belongs to.
 * @param {string} jobStatus - The current status of the job as returned by
 * [getJobProgramStatus]{@link Session#getJobProgramStatus}.
 * @param {number} jobId - The id of the job to monitor.
 * @returns {Promise}
 * <ul>
 *    <li>
 *      <b>Resolve</b> {[jobStatusInformation]{@link
 *      module:scheduler/monitors~jobStatusInformation}} - Object holding
 *      information regarding status of the job currently being handled by the
 *      SGE.
 *    </li>
 *    <li>
 *      <b>Reject</b> {string} - A brief description of the error.
 *    </li>
 * </ul>
 */
function monitorSingleJob(session, scheduler, jobStatus, jobId) {
  return new Promise(function (resolve, reject) {
    try {
      // Relevant job information are stored in local variables in order to
      // minimize the number of accesses to the jobs_ object.
      var jobName = scheduler.jobs_[jobId].jobName;
      var prevJobStatus = scheduler.jobs_[jobId].jobStatus;
      var submitDate = scheduler.jobs_[jobId].submitDate;

      // If the job has not yet been completed but its status changed from
      // ON-HOLD/QUEUED to RUNNING, said status is updated to the current
      // RUNNING value and the submitDate field is updated to represent
      // the approximate time at which the job switched from QUEUED to RUNNING.
      if (jobStatus[jobId].mainStatus === 'RUNNING' && prevJobStatus !== 'RUNNING') {
        console.log('Job ' + jobId + ' (' + jobName + ') status changed from ' + prevJobStatus + ' to ' + jobStatus[jobId].mainStatus + '.');
        resolve({
          jobId: jobId,
          jobName: jobName,
          sessionName: session.sessionName,
          mainStatus: jobStatus[jobId].mainStatus,
          subStatus: jobStatus[jobId].subStatus,
          exitStatus: null,
          errors: null,
          failed: null,
          description: 'Job switched from ' + prevJobStatus + ' to ' + jobStatus[jobId].mainStatus + '.'
        });

        scheduler.jobs_[jobId].jobStatus = jobStatus[jobId].mainStatus;
        scheduler.jobs_[jobId].submitDate = new Date().getTime();
      }

      // Terminates and removes from history jobs which are in ERROR state or
      // still queued or running after the maximum allotted runtimes.
      else if (jobStatus[jobId].mainStatus !== 'COMPLETED') {
          var currentTime = new Date().getTime();

          // The job is in ERROR state and is deleted.
          if (jobStatus[jobId].mainStatus === 'ERROR') {
            console.log('Job ' + jobId + ' (' + jobName + ') is in ' + jobStatus[jobId].mainStatus + ' state.');
            deleteErrorJob(session, scheduler, jobId).then(function (jobInfo) {
              resolve({
                jobId: jobId,
                jobName: jobName,
                sessionName: session.sessionName,
                mainStatus: jobStatus[jobId].mainStatus,
                subStatus: 'DELETED',
                exitStatus: jobInfo.exitStatus,
                errors: jobInfo.errors,
                failed: jobInfo.failed,
                description: 'An error occurred.'
              });
            }, function (error) {
              reject(error);
            });
          }
          // The job exceeded one of the timeouts and is deleted.
          else if (jobStatus[jobId].mainStatus !== 'RUNNING' && currentTime - submitDate > scheduler.maxJobQueuedTime_ || jobStatus[jobId].mainStatus === 'RUNNING' && currentTime - submitDate > scheduler.maxJobRunningTime_) {
              console.log('Job ' + jobId + ' (' + jobName + ') has exceeded maximum ' + jobStatus[jobId].mainStatus + ' runtime.');
              deleteJob(session, scheduler, jobId, jobStatus[jobId].mainStatus === 'RUNNING').then(function (jobInfo) {
                resolve({
                  jobId: jobId,
                  jobName: jobName,
                  sessionName: session.sessionName,
                  mainStatus: 'COMPLETED',
                  subStatus: 'DELETED',
                  exitStatus: jobStatus[jobId].mainStatus === 'RUNNING' ? jobInfo.exitStatus : null,
                  errors: ['Maximum ' + jobStatus[jobId].mainStatus + ' runtime exceeded.'],
                  failed: jobStatus[jobId].mainStatus === 'RUNNING' ? jobInfo.failed : null,
                  description: 'Maximum ' + jobStatus[jobId].mainStatus + ' runtime exceeded.'
                });
              }, function (error) {
                reject(error);
              });
            } else {
              // The job was running during the previous check and it still is.
              resolve({
                jobId: jobId,
                jobName: jobName,
                sessionName: session.sessionName,
                mainStatus: jobStatus[jobId].mainStatus,
                subStatus: jobStatus[jobId].subStatus,
                exitStatus: null,
                errors: null,
                failed: null,
                description: 'Job still running.'
              });
            }
        }
        // Jobs whose execution ended within the maximum allotted runtimes
        // are removed from history.
        else if (jobStatus[jobId].mainStatus === 'COMPLETED') {
            console.log('Job ' + jobId + ' (' + jobName + ') already terminated execution.');
            session.wait(jobId, 60000).then(function (jobInfo) {
              resolve({
                jobId: jobId,
                jobName: jobName,
                sessionName: session.sessionName,
                mainStatus: jobStatus[jobId].mainStatus,
                subStatus: jobStatus[jobId].subStatus,
                exitStatus: jobInfo.exitStatus,
                errors: jobInfo.errors,
                failed: jobInfo.failed,
                description: 'Job completed within allotted runtimes.'
              });
            }, function (error) {
              reject('Could not read job status: ' + error);
            });
            scheduler.removeJobFromHistory(jobId);
          }
    } catch (error) {
      console.log('Error fetching job ' + jobId + 'from job history.');
      reject('Error fetching job ' + jobId + 'from job history: ' + error);
    }
  });
}

/**
 * Compares the current status of the job (of {@link JOB_TYPE}.ARRAY) specified
 * by the index parameter to the one stored in the job history (hence memorized
 * during the previous call of this function or, if the function has not been
 * called before, after the job was submitted) for this job and takes
 * appropriate action if necessary. The job is comprised of several tasks which
 * need to be examined since they determine the status of the job itself.
 * Since the status of an array job is UNDETERMINED if at least one of its tasks
 * is not completed, the status of the first task is examined in order to
 * determine if the job as a whole is to be considered QUEUED/ON_HOLD (if the
 * first task itself is) or not (if the first task already started RUNNING).<br>
 * The events which are checked and the resulting actions are the following:
 * <br><br>
 *
 * (1) the job is in ERROR state (one or more of its tasks is in ERROR) -->
 * the job is forcibly terminated and deleted from history;<br>
 * (2) the first task of the job was !RUNNING, is still !RUNNING and the time
 * limit for !RUNNING array jobs ([maxArrayJobQueuedTime_]{@link
    * scheduler/schedulerManager#maxArrayJobQueuedTime_}) has been exceeded -->
 * the
 * job is forcibly terminated and deleted from history;<br>
 * (3) at least the first task of the job started RUNNING and total execution
 * time of the job has exceeded the time limit for RUNNING array jobs
 * ([maxArrayJobRunningTime_]{@link
    * scheduler/schedulerManager#maxArrayJobRunningTime_}) --> the job is
 * forcibly
 * terminated and deleted from history;<br>
 * (4) the job was !COMPLETED and is now COMPLETED --> the job is deleted from
 * history.<br><br>
 *
 * Note: the total running time of the job (point (3)) is calculated by summing
 * the RUNNING time of each task.<br>
 * Note: the runningStart and runningTime fields of each task are used in the
 * computation of the total running time of the job (point (3)).<br>
 * Note: given the asynchronicity of this function and the ones which call it,
 * the runningStart and runningTime fields of each task are subjected to
 * unavoidable approximations, whose precision is inversely proportional to the
 * time interval between two subsequent calls of this function (regulated by the
 * [jobPollingInterval]{@link scheduler/schedulerManager#jobPollingInterval}
 * parameter).<br><br>
 *
 * The promise always resolves unless an error occurs.
 *
 * @param {Session} session - The name of the Drmaa
 * session the job belongs to.
 * @param {string} jobStatus - The current status of the job as returned by
 * [getJobProgramStatus]{@link Session#getJobProgramStatus}.
 * @param {number} jobId - The id of the job to monitor.
 * @returns {Promise}
 * <ul>
 *    <li>
 *      <b>Resolve</b> {[jobStatusInformation]{@link
 *      module:scheduler/monitors~jobStatusInformation}} - Object holding
 *      information regarding status of the job currently being handled by the
 *      SGE.
 *    </li>
 *    <li>
 *      <b>Reject</b> {string} - A brief description of the error.
 *    </li>
 * </ul>
 */
function monitorArrayJob(session, scheduler, jobStatus, jobId) {
  return new Promise(function (resolve, reject) {
    try {
      var _ret = function () {
        // Relevant job information are stored in local variables in order to
        // minimize the number of accesses to the jobs_ object.
        var jobName = scheduler.jobs_[jobId].jobName;
        var submitDate = scheduler.jobs_[jobId].submitDate;
        var taskInfo = scheduler.jobs_[jobId].taskInfo;
        var firstTaskId = scheduler.jobs_[jobId].firstTaskId;
        var lastTaskId = scheduler.jobs_[jobId].lastTaskId;
        var increment = scheduler.jobs_[jobId].increment;
        var totalExecutionTime = scheduler.jobs_[jobId].totalExecutionTime;

        // One or more of the job's tasks are in ERROR. The whole job is deleted.
        if (jobStatus[jobId].mainStatus === 'ERROR') {
          console.log('Job ' + jobId + ' (' + jobName + ') is in ' + jobStatus[jobId].mainStatus + ' state.');
          deleteErrorJob(session, scheduler, jobId).then(function (jobInfo) {
            resolve({
              jobId: jobId,
              jobName: jobName,
              sessionName: session.sessionName,
              mainStatus: jobStatus[jobId].mainStatus,
              subStatus: 'DELETED',
              exitStatus: jobInfo.exitStatus,
              failed: jobInfo.failed,
              errors: jobInfo.errors,
              description: 'An error occurred.'
            });
          }, function (error) {
            reject(error);
          });
        } else if (jobStatus[jobId].mainStatus !== 'COMPLETED') {
          var currentTime = new Date().getTime();
          // If the first task is still not running after the maximum allotted
          // queued time, the job is deleted and removed from history.
          if (jobStatus[jobId].tasksStatus[firstTaskId].mainStatus !== 'COMPLETED' && jobStatus[jobId].tasksStatus[firstTaskId].mainStatus !== 'RUNNING' && currentTime - submitDate > scheduler.maxArrayJobQueuedTime_) {
            console.log('Job ' + jobId + ' (' + jobName + ') has exceeded maximum ' + jobStatus[jobId].tasksStatus[firstTaskId].mainStatus + ' runtime. Terminating.');
            deleteJob(session, scheduler, jobId, false).then(function () {
              resolve({
                jobId: jobId,
                jobName: jobName,
                sessionName: session.sessionName,
                mainStatus: 'COMPLETED',
                subStatus: 'DELETED',
                exitStatus: null,
                failed: null,
                errors: ['Maximum ' + jobStatus[jobId].tasksStatus[firstTaskId].mainStatus + ' runtime exceeded.'],
                description: 'Maximum ' + jobStatus[jobId].tasksStatus[firstTaskId].mainStatus + ' runtime exceeded.'
              });
            }, function (error) {
              reject(error);
            });
          } else {
            var _loop = function _loop(taskId) {
              var taskIndex = taskInfo.findIndex(function (elem) {
                return elem.taskId === taskId;
              });

              // If the task has already been completed, no further analysis for
              // this task is needed.
              if (taskInfo[taskIndex].status === 'COMPLETED') return 'continue';

              if (jobStatus[jobId].tasksStatus[taskId].mainStatus === 'RUNNING') {
                // If the task went from not running to running, the runningStart
                // field and status field of the task are updated.
                if (taskInfo[taskIndex].status !== 'RUNNING') {
                  taskInfo[taskIndex].runningStart = currentTime;
                  console.log('Task ' + taskId + ' of job ' + jobId + ' started running on ' + new Date(taskInfo[taskIndex].runningStart).toUTCString() + '.');
                  console.log('Task ' + taskId + ' status of job ' + jobId + ' changed from ' + taskInfo[taskIndex].status + ' to ' + jobStatus[jobId].tasksStatus[taskId].mainStatus + '.');
                  taskInfo[taskIndex].status = jobStatus[jobId].tasksStatus[taskId].mainStatus;
                }
                // If the task was running during the previous check and it still
                // is, the total execution time of the job is updated accordingly.
                else {
                    // Running time as of the previous check.
                    var previousRunningTime = taskInfo[taskIndex].runningTime;
                    // If the runningStart parameter is equal to 0 then the task
                    // started directly as RUNNING and the task can be considered to
                    // have approximately started running at the current time. The
                    // runningStart parameter is updated to reflect this assumption.
                    taskInfo[taskIndex].runningStart = taskInfo[taskIndex].runningStart === 0 ? currentTime : taskInfo[taskIndex].runningStart;
                    // The running time of the task is calculated using the current
                    // time and the time at which the task switched to RUNNING.
                    taskInfo[taskIndex].runningTime = currentTime - taskInfo[taskIndex].runningStart;
                    // The total execution time of the job is updated.
                    totalExecutionTime += taskInfo[taskIndex].runningTime - previousRunningTime;

                    console.log('Task ' + taskId + ' of job ' + jobId + ' current running time: ' + new Date(taskInfo[taskIndex].runningTime) + '.');
                    console.log('Total execution time of job ' + jobId + ' (' + jobName + '): ' + totalExecutionTime + '.');
                  }
              }
              // The task is now COMPLETED and it was not during the previous
              // check.
              // The total execution time of the job and the status of the task
              // are updated accordingly.
              else if (jobStatus[jobId].tasksStatus[taskId].mainStatus === 'COMPLETED') {
                  var _previousRunningTime = taskInfo[taskIndex].runningTime;
                  taskInfo[taskIndex].runningTime = currentTime - taskInfo[taskIndex].runningStart;
                  totalExecutionTime += taskInfo[taskIndex].runningTime - _previousRunningTime;

                  console.log('Task ' + taskId + ' status of job ' + jobId + ' changed from ' + taskInfo[taskIndex].status + ' to ' + jobStatus[jobId].tasksStatus[taskId].mainStatus + '.');
                  console.log('Task ' + taskId + ' of job ' + jobId + ' completed execution in: ' + new Date(taskInfo[taskIndex].runningTime) + '.');
                  console.log('Total execution time of job ' + jobId + ' (' + jobName + '): ' + totalExecutionTime + '.');
                  taskInfo[taskIndex].status = jobStatus[jobId].tasksStatus[taskId].mainStatus;
                }
              // If the job total execution time has exceeded the maximum value,
              // the job is terminated and removed from history.
              if (totalExecutionTime > scheduler.maxArrayJobRunningTime_) {
                console.log('Job ' + jobId + ' (' + jobName + ') has exceeded maximum RUNNING runtime. Terminating.');
                deleteJob(session, scheduler, jobId, true).then(function (jobInfo) {
                  resolve({
                    jobId: jobId,
                    jobName: jobName,
                    sessionName: session.sessionName,
                    mainStatus: 'COMPLETED',
                    subStatus: 'DELETED',
                    exitStatus: jobInfo.exitStatus,
                    failed: jobInfo.failed,
                    errors: ['Maximum RUNNING runtime exceeded.'],
                    description: 'Maximum RUNNING runtime exceeded.'
                  });
                }, function (error) {
                  reject(error);
                });
                return {
                  v: {
                    v: void 0
                  }
                };
              }
            };

            // Scans the array of tasks.
            for (var taskId = firstTaskId; taskId <= lastTaskId; taskId += increment) {
              var _ret2 = _loop(taskId);

              switch (_ret2) {
                case 'continue':
                  continue;

                default:
                  if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
              }
            }
            // Updates the taskInfo and totalExecutionTime fields of the job in
            // the job history.
            scheduler.jobs_[jobId].taskInfo = taskInfo;
            scheduler.jobs_[jobId].totalExecutionTime = totalExecutionTime;

            // The job is still running.
            resolve({
              jobId: jobId,
              jobName: jobName,
              sessionName: session.sessionName,
              mainStatus: jobStatus[jobId].mainStatus,
              subStatus: jobStatus[jobId].subStatus,
              exitStatus: null,
              failed: null,
              errors: null,
              description: 'Job still RUNNING.'
            });
          }
        }
        // The job as a whole is now COMPLETED. The job is removed from history.
        else if (jobStatus[jobId].mainStatus === 'COMPLETED') {
            console.log('Job ' + jobId + ' (' + jobName + ') already terminated execution.');
            session.wait(jobId, 60000).then(function (jobInfo) {
              resolve({
                jobId: jobId,
                jobName: jobName,
                sessionName: session.sessionName,
                mainStatus: jobStatus[jobId].mainStatus,
                subStatus: jobStatus[jobId].subStatus,
                exitStatus: jobInfo.exitStatus,
                errors: jobInfo.errors,
                failed: jobInfo.failed,
                description: 'Job completed within allotted runtimes.'
              });
            }, function (error) {
              reject('Could not read job status: ' + error);
            });
            scheduler.removeJobFromHistory(jobId);
          }
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    } catch (error) {
      console.log('Error fetching job ' + jobId + 'from job history.');
      reject('Error fetching job ' + jobId + 'from job history: ' + error);
    }
  });
}

/**
 * Deletes the job specified by the jobId parameter and removes it from the job
 * history.<br><br>
 *
 * The promise resolves if the job could be deleted.
 *
 * @param {Session} session - The name of the Drmaa session the job
 * belongs to.
 * @param {number} jobId - The id of the job to terminate and remove from
 * history.
 * @param {boolean} qacctAvailable - True if the qacct command can find
 * information about this job after its deletion. This is impossible if the job
 * was terminated while not RUNNING.
 * @returns {Promise}
 * <ul>
 *    <li>
 *      <b>Resolve</b> {{@link JobInfo}} - Object containing several
 *      information about the deleted job.
 *    </li>
 *    <li>
 *      <b>Reject</b> {string} - A dump of the error if the status of the job
 *      could not be deleted.
 *    </li>
 * </ul>
 */
function deleteJob(session, scheduler, jobId, qacctAvailable) {
  return new Promise(function (resolve, reject) {
    try {
      session.control(jobId, session.TERMINATE).then(function () {
        var jobName = scheduler.jobs_[jobId].jobName;
        console.log('Job ' + jobId + ' terminated.');
        if (qacctAvailable) {
          session.wait(jobId, 60000).then(function (jobInfo) {
            scheduler.removeJobFromHistory(jobId);
            resolve(jobInfo);
          }, function (error) {
            console.log('Error waiting for ' + jobId + ' (' + jobName + ') to return information.');
            reject(error);
          });
        } else {
          scheduler.removeJobFromHistory(jobId);
          resolve();
        }
      }, function (error) {
        console.log('Could not terminate job ' + jobId + '. \n' + error);
        reject(error);
      });
    } catch (error) {
      console.log('Error fetching job ' + jobId + 'from job history.');
      reject('Error fetching job ' + jobId + 'from job history: ' + error);
    }
  });
}

/**
 * Deletes the job in ERROR state specified by the jobId parameter and removes
 * it from the job history.<br><br>
 *
 * The promise resolves if the job could be deleted.
 *
 * @param {Session} session - The name of the Drmaa session the job
 * belongs to.
 * @param {number} jobId - The id of the job to terminate and remove from
 * history.
 * @returns {Promise}
 * <ul>
 *    <li>
 *      <b>Resolve</b> {{@link JobInfo}} - Object containing several
 *      information about the deleted job.
 *    </li>
 *    <li>
 *      <b>Reject</b> {string} - A dump of the error if the status of the job
 *      could not be deleted.
 *    </li>
 * </ul>
 */
function deleteErrorJob(session, scheduler, jobId) {
  return new Promise(function (resolve, reject) {
    try {
      var jobName = scheduler.jobs_[jobId].jobName;
      session.wait(jobId, 60000).then(function (jobInfo) {
        session.control(jobId, session.TERMINATE).then(function () {
          scheduler.removeJobFromHistory(jobId);
          resolve(jobInfo);
        }, function (error) {
          console.log('Could not terminate job ' + jobId + ': ' + error);
          reject(error);
        });
      }, function (error) {
        console.log('Error waiting for ' + jobId + ' (' + jobName + ') to return information.');
        reject(error);
      });
    } catch (error) {
      console.log('Error fetching job ' + jobId + 'from job history.');
      reject('Error fetching job ' + jobId + 'from job history: ' + error);
    }
  });
}