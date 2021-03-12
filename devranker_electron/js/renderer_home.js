try {
  // Logs from Node.js(console.log wont work in renderer.js as this is not associated with main process, but from Html Script Tag)  
  var nodeConsole = require('console');
  var { PythonShell } = require('python-shell');
  var myConsole = new nodeConsole.Console(process.stdout, process.stderr);
  const { ipcRenderer } = require('electron')
  const { remote } = require('electron')
  // To handle Files 
  const fs = require('fs');

  // REST API Upload
  var TAG = '\n(renderer_main.js::)\n'
  let URL = 'http://localhost:5000/predict'
  let pythonFileName = './py/devranker_functions.py'
  // to replace os.path.join in python
  var path = require('path');

  // To make API Calls, Especially to Upload Anonymized file
  const axios = require('axios');

  let pyshell = new PythonShell(pythonFileName);


  // Required file paths
  let pathInfo = {
    devranker_dir: "",
    output_file_name: "",
    gitDirectory: "",
    DestDirectory: "",
    email_hash_dict_file_path: "",
    anonymized_file_path: "",
    predicted_file_path: "",
    de_anonymized_file_path: "",
  };

  function getRepoDataFileName() {
    return path.basename(pathInfo.gitDirectory) + '.git.csv'
  }



  // ***********************************************
  // **************** COMMUNICATION ****************
  // ***********************************************
  // ASYNCHRONOUS - RECEIVER
  ipcRenderer.on('asynchronous-reply-setPathInfo', (event, arg) => {
    console.log('renderer_home.js::anynchronous-reply-pathInfo::', arg)
  })


  async function apicall_getPredictionsFile() {

    const fs = require('fs');
    const got = require('got')

    const FormData = require('form-data');
    var formData = new FormData();
    formData.append('anonymised_file', fs.createReadStream(pathInfo.anonymized_file_path));
    // TODO: Ravi - Replace this code to get file name also from Response
    let filePath = path.join(pathInfo.devranker_dir, 'cpu_scores_anonymized_' + getRepoDataFileName())
    try {
      const res = await got.stream(URL, {
        method: 'POST',
        body: formData,
        headers: {
          ...formData.getHeaders() // sets the boundary and Content-Type header
        }
      }).pipe(fs.createWriteStream(filePath)).
        on("finish", () => {

          pathInfo.predicted_file_path = filePath
          ann_predictions_file.innerHTML = pathInfo.predicted_file_path

          alert('Predictions File Generated Successfully.\n\nFile Location is:\n' + filePath)
          myConsole.log(`File downloaded to ${filePath}`);
        }).
        on("error", (error) => {
          alert('Predictions Failed, Please try again later.\n\n' + error.message)
          myConsole.error(`Could not write file to system: ${error}`);
        })

    } catch (e) {
      console.log(e);
    }
  }

  // ASYNCHRONOUS - SENDER
  function storePathInfoInMainJs() {
    ipcRenderer.send('asynchronous-setPathInfo', pathInfo)
    myConsole.log(TAG, 'btn_browse_dest_dir/pathInfo:', pathInfo)
  }

  // ***********************************************
  // **************** CLICK EVENTS  ****************
  // ***********************************************
  // Clone Repository
  btn_browse_cln_repo.addEventListener('click', async (event) => {

    try {
      const pathArray = await remote.dialog.showOpenDialog({ properties: ['openDirectory'] })

      let pathSel = pathArray.filePaths

      if (pathSel == '') {
        return
      }

      cln_repo.innerHTML = pathSel

      // Communicate with Python
      let options = {
        mode: 'text',
        args: ['check_git_dir', pathSel]
      };

      PythonShell.run(pythonFileName, options, function (err, results) {

        myConsole.log(TAG, 'error:', err, 'resp_result:', results)

        let data_parsed = JSON.parse(results[0])

        if (data_parsed.status == true) {
          pathInfo.gitDirectory = pathSel.toString()
        } else {
          alert(pathSel + '\n\n' + data_parsed.msg)
          cln_repo.innerHTML = ''
        }

        myConsole.log(TAG, 'btn_browse_cln_repo/pathInfo:', pathInfo)

      });
    } catch (err) {
      alert(err)
    }
  });

  // Browse Destination Directory
  btn_browse_dest_dir.addEventListener('click', async (event) => {
    try {
      const pathArray = await remote.dialog.showOpenDialog({ properties: ['openDirectory'] })

      let pathSel = pathArray.filePaths

      dest_dir.innerHTML = pathSel
      pathInfo.DestDirectory = pathSel.toString()
      myConsole.log(TAG, 'btn_browse_dest_dir/pathInfo:', pathInfo)
    } catch (err) {
      alert(err)
    }
  });

  // Start Mining
  btn_start_mining.addEventListener('click', async () => {

    try {

      // myConsole.log(TAG, 'btn_start_mining/pathInfo:', pathInfo)

      if (pathInfo.gitDirectory == '') {
        alert('Please Select Git Directory')
      } else if (pathInfo.DestDirectory == '') {
        alert('Please Select Destination Directory')
      } else {

        pathInfo.devranker_dir = path.join(pathInfo.DestDirectory, 'Devranker')
        pathInfo.output_file_name = path.join(pathInfo.devranker_dir, getRepoDataFileName())

        myConsole.log(TAG, 'btn_start_mining::AfterUpdate::', pathInfo)

        // Creating 'Devranker' Directory if not exists
        if (!fs.existsSync(pathInfo.devranker_dir)) {
          fs.mkdirSync(pathInfo.devranker_dir);
          alert('Created working Directory: \n' + pathInfo.devranker_dir)
        }

        // Communicate with Python
        let options = {
          mode: 'text',
          args: ['start_mining', pathInfo.gitDirectory, pathInfo.devranker_dir, pathInfo.output_file_name]
        };

        progress_element.value = "0"
        // Showing Progressbar
        show_progress.style.display = "block"

        let pyshell = new PythonShell(pythonFileName, options);

        pyshell.on('message', function (message) {

          let data_parsed = JSON.parse(message)

          try {

            myConsole.log("btn_start_mining/PhthonShell-start_mining::", message)

            if (data_parsed.msg == 'Done') {

              alert("Mining is done and File location is \n\n" + pathInfo.output_file_name)
              // Hiding Porgressbar
              show_progress.style.display = "none"
              progress_display.innerHTML = ""

              data_file_location.innerHTML = pathInfo.output_file_name

            } else if (data_parsed.msg == 'Progress') {

              progress_element.max = data_parsed.tc
              progress_element.value = data_parsed.cc

              progress_display.innerHTML = data_parsed.cc + " / " + data_parsed.tc
              myConsole.log(data_parsed.cc, " / ", data_parsed.tc)

            } else {
              alert(message)
            }
          } catch (err) {
            alert(err)
          }
        });
      }
    } catch (err) {
      myConsole("Start Mining exception:", err)
      alert("btn_start_mining:" + err)
    }
  });

  // Anonymize
  btn_anonymize.addEventListener('click', (event) => {

    try {

      pathInfo.anonymized_file_path = path.join(pathInfo.devranker_dir, 'anonymized_' + getRepoDataFileName()) // path.basename(pathInfo.gitDirectory) + '.git.csv'
      pathInfo.email_hash_dict_file_path = pathInfo.output_file_name + '.email_dict.pickle'
      let options = {
        mode: 'text',
        args: ['anonymize', pathInfo.output_file_name, pathInfo.email_hash_dict_file_path, pathInfo.anonymized_file_path]
      };

      myConsole.log(TAG, 'btn_anonymize::', pathInfo)

      PythonShell.run(pythonFileName, options, function (err, results) {
        try {

          myConsole.log("PythonShell/anonymize/response::", results, err)
          myConsole.log("PythonShell/anonymize/error-response::", err)

          if (results != null) {

            let data = results[0]

            if (data == 'Done') {
              alert('Anonymize is done. \n\nAnonymize File location:\n' + pathInfo.anonymized_file_path +
                '\n\nAnonymize File Dictionary location:\n' + pathInfo.email_hash_dict_file_path)

              ann_file_location.innerHTML = pathInfo.anonymized_file_path
              ann_dict_located_at.innerHTML = pathInfo.email_hash_dict_file_path

            } else if (data == 'Testing') {
              myConsole.log('Testing', results)
            } else {
              alert("PythonShell Anonymize Exception::\n\n" + results)
            }
          } else {
            alert("PythonShell Anonymize Error::\n\n" + err)
          }
        } catch (err) {
          alert(err)
        }
      });
    } catch (err) {
      alert(err)
    }
  });

  // Get Predictions
  btn_get_predictions.addEventListener('click', (event) => {
    try {
      apicall_getPredictionsFile()
    } catch (err) {
      alert(err)
    }
  });

  // De-Anonymize
  btn_de_ann.addEventListener('click', (event) => {

    try {
      pathInfo.de_anonymized_file_path = path.join(pathInfo.devranker_dir, 'dev_scores_' + getRepoDataFileName())
      let options = {
        mode: 'text',
        args: ['de_anonymize',
          pathInfo.predicted_file_path,
          pathInfo.email_hash_dict_file_path,
          pathInfo.de_anonymized_file_path
        ]
      };

      myConsole.log(TAG, 'de_anonymize::', pathInfo)

      PythonShell.run(pythonFileName, options, function (error_result, results) {

        try {

          myConsole.log("PythonShell/de_anonymize::", 'results::', results, 'error response::', error_result)

          if (results != null) {

            let data = results[0]

            myConsole.log("de_anonymize::", results)

            if (data == 'Done') {

              alert('De Anonymizing is done. \n\nFile location is:\n' + pathInfo.de_anonymized_file_path)

              de_ann_pre_file.innerHTML = pathInfo.de_anonymized_file_path

              storePathInfoInMainJs()
            } else if (data == 'exc') {
              alert(results[1])
            }
          } else {
            alert(error_result)
          }
        } catch (err) {
          alert(err)
        }
      });
    } catch (err) {
      alert(err)
    }
  });


  // Data File Location at
  btn_dfla.addEventListener('click', async (event) => {
    try {
      const pathArray = await remote.dialog.showOpenDialog({ properties: ['openFile'] })
      let pathSel = pathArray.filePaths
      data_file_location.innerHTML = pathSel
      pathInfo.output_file_name = pathSel.toString()
    } catch (err) {
      alert(err)
    }
  });
  // Anonymization File Location at
  btn_afla.addEventListener('click', async (event) => {
    try {
      const pathArray = await remote.dialog.showOpenDialog({ properties: ['openFile'] })
      let pathSel = pathArray.filePaths
      ann_file_location.innerHTML = pathSel
      pathInfo.anonymized_file_path = pathSel.toString()
    } catch (err) {
      alert(err)
    }
  });
  // Anonymization Dictionary Located at
  btn_adla.addEventListener('click', async (event) => {
    try {
      const pathArray = await remote.dialog.showOpenDialog({ properties: ['openFile'] })
      let pathSel = pathArray.filePaths
      ann_dict_located_at.innerHTML = pathSel
      pathInfo.email_hash_dict_file_path = pathSel.toString()
    } catch (err) {
      alert(err)
    }
  });
  // Anonymization Predictions File
  btn_apf.addEventListener('click', async (event) => {
    try {
      const pathArray = await remote.dialog.showOpenDialog({ properties: ['openFile'] })
      let pathSel = pathArray.filePaths
      ann_predictions_file.innerHTML = pathSel
      pathInfo.predicted_file_path = pathSel.toString()
    } catch (err) {
      alert(err)
    }
  });

  // Change Graph File Location
  btn_graph_path.addEventListener('click', async (event) => {
    try {
      const pathArray = await remote.dialog.showOpenDialog({ properties: ['openFile'] })
      let pathSel = pathArray.filePaths
      de_ann_pre_file.innerHTML = pathSel
      pathInfo.de_anonymized_file_path = pathSel.toString()
      storePathInfoInMainJs()
    } catch (err) {
      alert(err)
    }
  });


  // Show Charts
  btn_show_charts.addEventListener('click', (event) => {
    // show_charts_href.click()
    remote.getCurrentWindow().loadFile('./html/graph.html')
  });

} catch (err) {
  alert(err)
  myConsole("Global exception:", err)
}