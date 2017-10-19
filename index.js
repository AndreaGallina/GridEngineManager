exports.SchedulerFactory = function(){ 
	var Sched = require("./scheduler/scheduler-factory");
	return new Sched.SchedulerFactory();
};

exports.SessionManager = function(){
	var Sess = require("./nDrmaa/sge/SessionManager");
	return new Sess.default();
};