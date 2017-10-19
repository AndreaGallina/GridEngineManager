"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _SessionManager2 = require("../SessionManager");

var _SessionManager3 = _interopRequireDefault(_SessionManager2);

var _JobMonitor = require("./JobMonitor");

var _JobMonitor2 = _interopRequireDefault(_JobMonitor);

var _sgeCli = require("./sge-cli");

var sge = _interopRequireWildcard(_sgeCli);

var _Session = require("./Session");

var _Session2 = _interopRequireDefault(_Session);

var _Exceptions = require("../Exceptions");

var Exception = _interopRequireWildcard(_Exceptions);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * @fileoverview Implementation of class SessionManager for SGE.
 *
 * @author Andrea Gallina
 */

/**
 * Implementation of class SessionManager for SGE.
 * @extends SessionManager
 */
var SessionManagerImpl = function (_SessionManager) {
  _inherits(SessionManagerImpl, _SessionManager);

  /**
   * Retrieves the version of SGE and initializes SessionManager.
   * Parameter "ready" is a promise that is resolved only if we were able
   * to retrieve SGE version, and it used as a ready check in all the
   * methods of the base class.
   */
  function SessionManagerImpl() {
    _classCallCheck(this, SessionManagerImpl);

    var _this = _possibleConstructorReturn(this, (SessionManagerImpl.__proto__ || Object.getPrototypeOf(SessionManagerImpl)).call(this));

    console.log("Loading DRMAA Libs for SGE");
    _this.ready = new Promise(function (resolve, reject) {
      sge.getDrmsInfo().then(function (drmsInfo) {
        console.log("SGE DRMAA Ready");
        _this.jobsMonitor = new _JobMonitor2.default();
        _this.SessionConstructor = _Session2.default;
        _this.drmsName = drmsInfo.drmsName;
        _this.drmsVersion = drmsInfo.version;
        resolve(true);
      }).catch(function () {
        reject(new Exception.DrmsInitException("Could not initialize SGE: check running status."));
      });
    });

    return _this;
  }

  return SessionManagerImpl;
}(_SessionManager3.default);

exports.default = SessionManagerImpl;