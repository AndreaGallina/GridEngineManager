## GridEngineManager

GridEngineManager is a NodeJs module to manage job submissions to the Sun Grid Engine (SGE) and the monitoring of submitted jobs.

Several parameters can be configured in order to automatically allow or reject job submission requests. A proper setup of said parameters can be exploited to ensure the system only accepts the requests that do not violate any of the constraints implemented by the module, such as the possibility to black/whitelist users, limit the number of requests a specific user or all users can issue within a certain amount of time, or limiting the number of jobs that can be handled concurrently by the SGE.
Once a job is submitted to the SGE, the monitoring process takes care of notifying the submitter of the request of any meaningful events, such as the (un)successful completion of a job or the violation of any job-related constraints (the job has been running/queued for longer than the user-specified maximum time) and the subsequent deletion of the job.

GridEngineManager includes a library, which adheres to Drmaa standards for the most part, used by the module itself to communicate with the SGE, providing a quick and safe way to perform all manners of scheduling operations programmatically instead of resorting to shell commands.


### INSTALLATION

Standard installation via npm:

```
npm install gridenginemanager
```

or

```
npm install gridenginemanager --save 
```

if you want the package to be automatically added to the dependencies section of your package.json file.

### USAGE

First, import the scheduler and the GridEngineManager session manager:

```
var SchedulerFactory = require("GridEngineManager").SchedulerFactory;
var SessionManager = require("GridEngineManager").SessionManager;
```

Once imported, you will be able to instantiate SchedulerFactory and SessionManager instances like this:

```
var sf = new SchedulerFactory();
var sm = new SessionManager();
```

Extensive documentation in JSDoc format can be found in the documentation.tar.gz file. A tutorial is also present: it features an explanation of the instantiation and the configuration of a SchedulerManager instance (the class handling job submissions), a basic example of usage of SchedulerManager and an in-depth explanation of what actually goes on before, during, and after a request is received by the module.
