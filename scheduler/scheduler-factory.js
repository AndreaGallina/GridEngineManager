'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @fileoverview Class that manages instantiation, retrieval and deletion of
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * [SchedulerManager]{@link scheduler/SchedulerManager} objects.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @author Marco Speronello
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


var _schedulerManager = require('./scheduler-manager');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Array storing SchedulerManager instances.
var schedulers_ = [];

/**
 * Class that manages instantiation and retrieval and deletion of
 * [SchedulerManager]{@link scheduler/SchedulerManager} objects.
 *
 * @alias scheduler/SchedulerFactory
 */

var SchedulerFactory = function () {
  /**
   * Initializes an instance of the class.
   */
  function SchedulerFactory() {
    _classCallCheck(this, SchedulerFactory);

    console.log('Initialized SchedulerFactory.');
  }

  /**
   * Creates a [SchedulerManager]{@link scheduler/SchedulerManager} object.
   *
   * @param {string} name - The name of the [SchedulerManager]{@link
   * scheduler/SchedulerManager} to create.
   * @param {string} inputFile - The path of the file with the
   * [SchedulerManager]{@link scheduler/SchedulerManager} input parameters.
   * @returns {scheduler/SchedulerManager} The newly created SchedulerManager.
   * @throws {Error} The name provided was null or an empty string, or a
   * [SchedulerManager]{@link scheduler/SchedulerManager} with this name already
   * exists.
   */


  _createClass(SchedulerFactory, [{
    key: 'createSchedulerManager',
    value: function createSchedulerManager(name, inputFile) {
      if (name === '' || name === null) {
        console.log('Name must be a non-empty string.');
        throw new Error('Name must be a non-empty string.');
      }
      if (schedulers_.findIndex(function (elem) {
        return elem.name === name;
      }) !== -1) {
        console.log('A SchedulerManager instance named "' + name + '" already exists.');
        throw new Error('A SchedulerManager instance named "' + name + '" already exists.');
      }
      schedulers_.push({
        name: name,
        schedulerManager: new _schedulerManager.SchedulerManager(name, inputFile)
      });
      console.log('SchedulerManager instance "' + name + '" created.');
      return schedulers_[schedulers_.findIndex(function (elem) {
        return elem.name === name;
      })].schedulerManager;
    }

    /**
     * Returns the specified [SchedulerManager]{@link scheduler/SchedulerManager}
     * object.
     *
     * @param {string} name - The name of the [SchedulerManager]{@link
     * scheduler/SchedulerManager} to retrieve.
     * @returns {scheduler/SchedulerManager} The specified SchedulerManager.
     * @throws {Error} The name provided was null or an empty string, or a
     * [SchedulerManager]{@link scheduler/SchedulerManager} with this name does
     * not exist.
     */

  }, {
    key: 'getSchedulerManager',
    value: function getSchedulerManager(name) {
      if (name === '' || name === null) {
        console.log('Name must be a non-empty string.');
        throw new Error('Name must be a non-empty string.');
      }
      var index = schedulers_.findIndex(function (elem) {
        return elem.name === name;
      });
      if (index === -1) {
        console.log('A SchedulerManager instance named "' + name + '" does not exist.');
        throw new Error('A SchedulerManager instance named "' + name + '" does not exist.');
      } else {
        console.log('SchedulerManager instance "' + name + '" found.');
        return schedulers_[index].schedulerManager;
      }
    }

    /**
     * Deletes the specified [SchedulerManager]{@link scheduler/SchedulerManager}
     * object.
     *
     * @param {string} name - The name of the [SchedulerManager]{@link
     * scheduler/SchedulerManager} to delete.
     * @throws {Error} The name provided was null or an empty string, or a
     * [SchedulerManager]{@link scheduler/SchedulerManager} with this name does
     * not exist.
     */

  }, {
    key: 'deleteSchedulerManager',
    value: function deleteSchedulerManager(name) {
      if (name === '' || name === null) {
        console.log('Name must be a non-empty string.');
        throw new Error('Name must be a non-empty string.');
      }
      var index = schedulers_.findIndex(function (elem) {
        return elem.name === name;
      });
      if (index === -1) {
        console.log('A SchedulerManager instance named "' + name + '" does not exist.');
        throw new Error('A SchedulerManager instance named "' + name + '" does not exist.');
      } else {
        schedulers_.splice(index, 1);
        console.log('SchedulerManager instance "' + name + '" deleted.');
      }
    }
  }]);

  return SchedulerFactory;
}();

module.exports.SchedulerFactory = SchedulerFactory;