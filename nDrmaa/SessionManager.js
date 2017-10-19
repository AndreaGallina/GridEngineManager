"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @fileoverview Abstract class used to create and manage objects of class Session, tailored to the DRMS in use.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      *
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * @author Andrea Gallina
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _Exceptions = require("./Exceptions");

var Exception = _interopRequireWildcard(_Exceptions);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _Sessions = {}; // List of active sessions created by the SessionManager

/**
 * Abstract class used to create and manage objects of class Session, tailored to the DRMS in use.
 */

var SessionManager = function () {
  /**
   * Initialize an empty session manager
   * @return {SessionManager}
   */
  function SessionManager() {
    _classCallCheck(this, SessionManager);

    // Make sure that this class can't be constructed directly but only through subclasses
    if (new.target === SessionManager) {
      throw new TypeError("Cannot construct SessionManager instances from its abstract class.");
    }

    /**
     * DRMS name.
     * @type {string}
     */
    this.drmsName = "";

    /**
     * DRMS version.
     * @type {string}
     */
    this.drmsVersion = "";

    /**
     * Job's monitor
     * @type {JobMonitor}
     */
    this.jobsMonitor = null;

    /**
     * Reference to the implementation of the DRMS-specific Session class
     * @type {Session}
     */
    this.SessionConstructor = null;

    return this;
  }

  /**
   * Creates a new Session with name sessionName
   * @param sessionName: name of the session to create
   * @param contact: contact info.
   * @return {Promise} Promise returning the created session.
   * @throws {module:nDrmaaExceptions.InvalidArgumentException} InvalidArgumentException - Caller did not specify
   *    a session name
   * @throws {module:nDrmaaExceptions.AlreadyActiveSessionException} AlreadyActiveSessionException - Tried to create
   *    a session with a name that is already in use by another session
   */


  _createClass(SessionManager, [{
    key: "createSession",
    value: function createSession(sessionName, contact) {
      var _this = this;

      return this.ready.then(function () {
        if (!sessionName) {
          throw new Exception.InvalidArgumentException("Must provide a session's name for method 'createSession'");
        }
        if (_Sessions[sessionName]) {
          throw new Exception.AlreadyActiveSessionException("A Session named '" + sessionName + "' already exists");
        }
        _Sessions[sessionName] = new _this.SessionConstructor(sessionName, _this.jobsMonitor, contact);

        return _Sessions[sessionName];
      });
    }

    /**
     * Retrieve the session identified by sessionName
     * @param {string} sessionName - The name of the session to retrieve
     * @return {Promise} Promise returning the session retrieved
     * @throws {module:nDrmaaExceptions.InvalidArgumentException} InvalidArgumentException - Caller did not specify a
     *    session name
     * @throws {module:nDrmaaExceptions.NoActiveSessionException} NoActiveSessionException - Tried to retrieve a
     *    non-existent session
     */

  }, {
    key: "getSession",
    value: function getSession(sessionName) {
      return this.ready.then(function () {
        if (!sessionName) {
          throw new Exception.InvalidArgumentException("Must provide a session's name for method 'getSession'");
        }
        if (!_Sessions[sessionName]) {
          throw new Exception.NoActiveSessionException("Session with name '" + sessionName + "' not found.");
        }
        return _Sessions[sessionName];
      });
    }

    /**
     * Closes the session identified by sessionName
     * @param {string} sessionName - Name of the session to close
     * @throws {module:nDrmaaExceptions.NoActiveSessionException} NoActiveSessionException - Tried to close a
     *    non-existent session.
     */

  }, {
    key: "closeSession",
    value: function closeSession(sessionName) {
      return this.ready.then(function () {
        if (!_Sessions[sessionName]) {
          throw new Exception.NoActiveSessionException("Session with name '" + sessionName + "' not found.");
        }
        delete _Sessions[sessionName];
      });
    }
  }, {
    key: "getVersion",


    /**
     * Returns the version of the DRMS in use
     * @return {Promise} Promise that returns an object of class Version containing the version of the DRMS
     */
    value: function getVersion() {
      var _this2 = this;

      return this.ready.then(function () {
        return _this2.drmsVersion;
      });
    }
  }]);

  return SessionManager;
}();

exports.default = SessionManager;