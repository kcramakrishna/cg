import PySimpleGUI as sg
import os
import sys
import git
from pydriller import RepositoryMining
import multiprocessing as mp
import pathlib
import pandas
import json
import logging
import more_itertools
import pickle
import hashlib

logging.basicConfig(level=logging.DEBUG)

# Widths of Starting, Middle & Last Widgets
width_1 = 30
width_2 = 60
width_3 = 12

# Heights of Starting, Middle & Last Widgets
height_1 = 1
height_2 = 1
height_3 = 1

# Height of Vertical Bars which are representing STEPs
v_height_1 = 10
v_height_2 = 10
v_height_3 = 10

# Flag to find buggy commits.
# Finding buggy commits entails using 'git blame' extensively. This takes a LOT of time.
# We have not yet fine tuned the logic to find 'buggy' commits. We should disable this to save time.
# Default is 'False'.
# For now, do not set this to 'True'.
findBuggyFlag = False

# Define a DEBUG flag with values from '0' to '5'. Default is '0' which is OFF.
# Use this cautiously - we are not validating for this
DEBUG = 0

# Initializing Variables
devranker_dir = ''
gitDirectory = ''
DestDirectory = ''
total_commits_count = 0

# Sub Layouts(Step1, Step2, Step3 & Step4) will be added to 'layout_main'
layout_step_1 = [
    [sg.Text('Select the Location of Cloned Repo', text_color='black', background_color='white',
             size=(width_1, height_1)),
     sg.Input(gitDirectory, key='_i_GitDirectory', enable_events=True, text_color='black',
              disabled=True, size=(width_2, height_2)),
     sg.FolderBrowse('Browse', target='_i_GitDirectory', pad=None, font=('MS Sans Serif', 10, 'bold'),
                     button_color=('red', 'white'), key='_fb_browse', size=(width_3, height_3))],

    [sg.Text('Select Destination Directory *', background_color='white', text_color='black', border_width=2,
             size=(width_1, height_1)),
     sg.Input(DestDirectory, key='_i_DestDirectory', enable_events=True, text_color='black',
              disabled=True, size=(width_2, height_2)),
     sg.FolderBrowse('Browse', target='_i_DestDirectory', pad=None, font=('MS Sans Serif', 10, 'bold'),
                     button_color=('red', 'white'), key='_fb_browse', size=(width_3, height_3))],

    [sg.Text('', background_color='white', text_color='black', size=(width_1, height_1)),
     sg.Button('Start Mining', key='_i_StartMining', font=('MS Sans Serif',
                                                           10, 'bold'), button_color=('blue', 'white'),
               size=(width_3, height_3)),
     # TODO: Ravi -> Commented 'Live Log Button' As KC Sir told to release it in next Beta Version
     #  sg.Button('Live Log', key='_i_LiveLog', font=('MS Sans Serif', 10, 'bold'), button_color=('orange', 'white'),
     #            size=(width_3, height_3))
     ],

    [sg.Text('', background_color='white', text_color='black', size=(width_1, height_1)),
     sg.ProgressBar(100, orientation='h', size=(20, 8), key='_pb'),
     sg.Text('', background_color='white', key='_t_ProgressValue', font=('MS Sans Serif', 10, 'bold'),
             text_color='black', size=(width_3, height_3))]
]

layout_step_2 = [

    # Data File Location
    [sg.Text('Data file location at', text_color='black', background_color='white', size=(width_1, height_1)),
     sg.Input(key='_i_DFL', background_color='white',
              disabled=True, text_color='black', size=(width_2, height_2)),
     #  sg.Button('Inspect', pad=None, font=('MS Sans Serif', 10, 'bold'),
     #            button_color=('orange', 'white'), key='_b_Inspect_DFL', size=(width_3, height_3))
     ],

    # 'Encrypt' Button
    [sg.Text('', background_color='white', text_color='black', size=(width_1, height_1)),
     # sg.Text('', background_color='white', text_color='black', size=(width_2-width_3, height_2-height_3)),
     sg.Button('Anonymize', pad=None, font=('MS Sans Serif', 10, 'bold'),
               button_color=('blue', 'white'), key='_b_Encrypt', size=(width_3, height_3))],

    # Anonymized File
    [sg.Text('Anonymization File Located at', background_color='white', text_color='black', border_width=2,
             size=(width_1, height_1)),
     sg.Input(key='_i_AFL', text_color='black',
              disabled=True, size=(width_2, height_2)),
     #  sg.Button('Inspect', pad=None, font=('MS Sans Serif', 10, 'bold'),
     #            button_color=('orange', 'white'), key='_b_Inspect_AFL', size=(width_3, height_3))
     ],

    # Anonymized Dictionary
    [sg.Text('Anonymization Dictionary Located at', background_color='white', text_color='black', border_width=2,
             size=(width_1, height_1)),
     sg.Input(key='_i_ADL', text_color='black',
              disabled=True, size=(width_2, height_2)),
     #  sg.Button('Inspect', pad=None, font=('MS Sans Serif', 10, 'bold'),
     #            button_color=('orange', 'white'), key='_b_Inspect_ADL', size=(width_3, height_3))
     ],

    # 'Get Predictions' Button
    [sg.Text('', background_color='white', text_color='black', size=(width_1, height_1)),
     # sg.Text('', background_color='white', text_color='black', size=(width_2-width_3, height_2-height_3)),
     sg.Button('Get Predictions', pad=None, font=('MS Sans Serif', 10, 'bold'),
               button_color=('blue', 'white'), key='_b_GetPredictions', size=(width_3, height_3))],
]

layout_step_3 = [
    [sg.Text('Anonymization Predictions File', background_color='white', text_color='black', border_width=2,
             size=(width_1, height_1)),
     sg.Input(key='_i_APF', text_color='black',
              disabled=True, size=(width_2, height_2)),
     #  sg.Button('Inspect', pad=None, font=('MS Sans Serif', 10, 'bold'),
     #            button_color=('orange', 'white'), key='_b_Inspect_APF', size=(width_3, height_3))
     ],

    # 'Decrypt' Button
    [sg.Text('', background_color='white', text_color='black', size=(width_1, height_1)),
     # sg.Text('', background_color='white', text_color='black', size=(width_2-width_3, height_2-height_3)),
     sg.Button('De Anonymize', pad=None, font=('MS Sans Serif', 10, 'bold'),
               button_color=('blue', 'white'), key='_b_Decrypt', size=(width_3, height_3))],
]

layout_step_4 = [
    [sg.Text('De-Anonymization Predictions File', background_color='white', text_color='black', border_width=2,
             size=(width_1, height_1)),
     sg.Input(key='_i_DAPF', text_color='black',
              disabled=True, size=(width_2, height_2)),
     #  sg.Button('Inspect', pad=None, font=('MS Sans Serif', 10, 'bold'),
     #            button_color=('orange', 'white'), key='_b_Inspects_DAPF', size=(width_3, height_3))
     ],

    # GET PREDICTIONS BUTTON
    [sg.Text('', background_color='white', text_color='black', size=(width_1, height_1)),
     # sg.Text('', background_color='white', text_color='black', size=(width_2-width_3, height_2-height_3)),
     sg.Button('Show Charts', pad=None, font=('MS Sans Serif', 10, 'bold'),
               button_color=('blue', 'white'), key='_b_Showcharts', size=(width_3, height_3))],
]

# Main layout going to be added to 'window'
layout_main = [
    # STEP 1
    [sg.Text('STEP 1', text_color='blue', background_color='white')],
    [sg.Text('', background_color='red', size=(2, v_height_1)),
     sg.Column(layout_step_1, background_color='white')],

    # STEP 2
    [sg.Text('STEP 2', text_color='blue', background_color='white')],
    [sg.Text('', background_color='blue', size=(2, v_height_2)),
     sg.Column(layout_step_2, background_color='white')],

    # STEP 3
    [sg.Text('STEP 3', text_color='blue', background_color='white')],
    [sg.Text('', background_color='blue', size=(2, v_height_3)),
     sg.Column(layout_step_3, background_color='white')],

    # STEP 4
    [sg.Text('STEP 4', text_color='blue', background_color='white')],
    [sg.Text('', background_color='blue', size=(2, v_height_3)),
     sg.Column(layout_step_4, background_color='white')],
]


##########################################################
##################   Setters & Getters   ##################
##########################################################
# devranker_dir
def set_devranker_dir():
    global devranker_dir
    # Ref: https://docs.python.org/3/library/os.path.html
    devranker_dir = os.path.join(DestDirectory, 'Devranker')
    if not os.path.exists(devranker_dir):
        os.mkdir(devranker_dir)
        sg.popup('Created working Directory: ', devranker_dir)
    logging.info("set_devranker_dir() devranker_dir = ", devranker_dir)


def get_devranker_dir():
    return devranker_dir


# output_file_name
def set_output_file_path():
    global output_file_name
    output_file_name = os.path.join(get_devranker_dir(), get_target_repo_raw_data_file_name())
    logging.info("set_output_filename() output_file_name = ", output_file_name)


def get_output_file_path():
    return output_file_name


# '.git.csv'
def get_target_repo_raw_data_file_name():
    return get_repo_name() + '.git.csv'


# DestDirectory
def set_dest_directory_path(path):
    global DestDirectory
    DestDirectory = path


def get_dest_directory_path():
    # global DestDirectory
    return DestDirectory


# gitDirectory
def set_git_directory_path(path):
    global gitDirectory
    gitDirectory = path


def get_git_directory_path():
    return gitDirectory


# repo Name
def get_repo_name():
    return os.path.basename(get_git_directory_path())


# anonymized
def get_anonymized_file_path():
    # return get_devranker_dir()+'/anonymized_'+get_target_repo_raw_data_file_name()
    return os.path.join(get_devranker_dir(), 'anonymized_' + get_target_repo_raw_data_file_name())


# anonymized dict
def get_email_hash_dict_file_path():
    return get_output_file_path() + '.email_dict.pickle'


# predictions dir
def get_predictions_directory_path():
    return get_devranker_dir()
    # return os.path.join(get_dest_directory_path(), 'predictions')


def get_anonymized_predictions_file_path():
    return os.path.join(get_devranker_dir(), 'scores_anonymized_elasticray.git.csv')


# def get_dev_predictions_file():
#     return os.path.join(get_predictions_directory_path(), 'dev_scores_'+get_target_repo_raw_data_file_name())


def validate_directories():
    if gitDirectory == '':
        sg.popup('Please Select Git Directory')
    elif DestDirectory == '':
        sg.popup('Please Select Output Directory')
    else:
        try:
            repo = git.Repo(gitDirectory)
            return True
        except:
            print('exc @ validate_directories', sys.exc_info())
            sg.popup('Invalid Git Directory, Please choose valid Git Directory')
            return False


# Methods related to 'DevRanker'
def process_commit(commit, doc_list, completed_commits):
    for mod in commit.modifications:
        # Create a field 'file_ext' which is the file 'type'
        # https://www.geeksforgeeks.org/how-to-get-file-extension-in-python/
        # 'pathlib.Path' gives extension 'None' for all '.' files i.e. .bashrc etc.
        #     it also gives an exception in some cases. We need to handle that too.
        file_ext = pathlib.Path(mod.filename).suffix or 'NoExt'

        mod_data = {'hash': commit.hash, 'Author': commit.author.name, 'Email': commit.author.email,
                    'message': commit.msg, 'authored_date': commit.author_date,
                    'Committer': commit.committer.name, 'committed_date': commit.committer_date,
                    'number_of_branches': len(commit.branches), 'in_main_branch': commit.in_main_branch,
                    'merge_commit?': commit.merge,
                    'number_of_mod_files': len(commit.modifications),
                    'file_name': mod.filename,
                    'file_ext': file_ext,
                    'file_change_type_name': mod.change_type.name,
                    'file_change_type_value': mod.change_type.value,
                    'file_old_path': mod.old_path, 'file_new_path': mod.new_path,
                    'number_functions_before': len(mod.methods_before),
                    'number_functions_after': len(mod.methods),
                    # Existing methods changed.
                    'number_functions_edited': len(mod.changed_methods),
                    'number_lines_added': mod.added, 'number_lines_removed': mod.removed,
                    'file_number_loc': mod.nloc, 'language_supported': mod.language_supported,
                    # Can we get number of lines which are comments?
                    #   Else,We may not need the below variable 'size'.
                    'file_size': 0 if mod.source_code is None else len(mod.source_code.splitlines()),
                    'dmm_unit_size': commit.dmm_unit_size,
                    'dmm_unit_complexity': commit.dmm_unit_complexity,
                    'dmm_unit_interfacing': commit.dmm_unit_interfacing,
                    'file_complexity': mod.complexity,
                    # We need to get exact details.
                    'tokens': mod.token_count
                    }

        # loading each commit tuple into the list
        # List appending is threadsafe: https://stackoverflow.com/a/18568017
        doc_list.append(mod_data)

    completed_commits.append(commit.hash)
    update_progress_bar(completed_commits)


def store_commit_data():
    # Creating empty lists for carrying commit data
    doclist = []
    # Using list to update progress bar because it's thread-safe
    completed_commits = []

    # Create Multithreading pool to use full CPU
    # Ref: https://pythonspeed.com/articles/python-multiprocessing/
    pool = mp.Pool(mp.cpu_count())

    # If the Repo has just been cloned, the program will traverse the whole Repo
    # https://dzone.com/articles/shared-counter-python%E2%80%99s
    commits = RepositoryMining(get_git_directory_path()).traverse_commits()
    # TODO: RAVI -> Move this into SETTERS/GETTERS
    global total_commits_count
    # 'more_itertools' used here to find commits count as 'commits' is Iterable
    # Note: ilen(commits) consumes the iterable 'commits'
    total_commits_count = more_itertools.ilen(commits)

    [pool.apply_async(process_commit(commit, doclist, completed_commits)) for commit in
     RepositoryMining(get_git_directory_path()).traverse_commits()]
    # Close Multiprocessing pool
    pool.close()
    pool.join()

    # We have data in json format but we need output as csv.
    # There are many approaches to doing this including using dictionaries and stuff.
    # But the easiest way is to write json to file using json.dump and using pandas to read json file.
    # Write data to temp file since pandas.read_json expects file. We can probably optimise without having to
    #     create a new file.
    temp_file = os.path.join(get_devranker_dir(), 'mod_data.json')
    with open(temp_file, 'w') as temp_out_file:
        # json.dump cannot handle python datetime object. We should convert this object to 'str'
        # https://stackoverflow.com/questions/11875770/how-to-overcome-datetime-datetime-not-json-serializable
        # https://code-maven.com/serialize-datetime-object-as-json-in-python
        json.dump(doclist, temp_out_file, default=str)

    # Use pandas to read json and write to csv.
    df = pandas.read_json(temp_file)
    df.to_csv(get_output_file_path())

    # Remove the temp file
    os.remove(temp_file)
    display_data_file_location_path()
    # Inform user that mining is complete
    sg.popup('Mining is done and File location is \n' + get_output_file_path())


def anonymize():
    target_repo_commits = pandas.read_csv(get_output_file_path())

    for i in range(len(target_repo_commits)):
        # Encrypt Author
        clear_text = target_repo_commits.loc[i, 'Author']
        hashed = hashlib.sha256(str(clear_text).encode()).hexdigest()
        target_repo_commits.loc[i, 'Author_encrypted'] = hashed

        # Encrypt Email
        clear_text = target_repo_commits.loc[i, 'Email']
        hashed = hashlib.sha256(str(clear_text).encode()).hexdigest()
        target_repo_commits.loc[i, 'Email_encrypted'] = hashed
        if DEBUG >= 1:
            print('hash, email: ', hashed, clear_text)

        # Encrypt Committer
        clear_text = target_repo_commits.loc[i, 'Committer']
        hashed = hashlib.sha256(str(clear_text).encode()).hexdigest()
        target_repo_commits.loc[i, 'Committer_encrypted'] = hashed

        # Encrypt file_name
        clear_text = target_repo_commits.loc[i, 'file_name']
        hashed = hashlib.sha256(str(clear_text).encode()).hexdigest()
        target_repo_commits.loc[i, 'file_name_encrypted'] = hashed

        # Encrypt file_old_path
        clear_text = target_repo_commits.loc[i, 'file_old_path']
        hashed = hashlib.sha256(str(clear_text).encode()).hexdigest()
        target_repo_commits.loc[i, 'file_old_path_encrypted'] = hashed

        # Encrypt file_new_path
        clear_text = target_repo_commits.loc[i, 'file_new_path']
        hashed = hashlib.sha256(str(clear_text).encode()).hexdigest()
        target_repo_commits.loc[i, 'file_new_path_encrypted'] = hashed

    # Create a dictionary for email-ids. We need this later to decrypt the predictions file.
    # We can ignore the other encrypted fileds for now.
    email_hash_dict = {}
    for author_email in target_repo_commits['Email'].unique().tolist():
        # First hash the email
        hashed_email = hashlib.sha256(str(author_email).encode()).hexdigest()
        # Now add the hash and corresponding email to dictionary
        email_hash_dict[hashed_email] = author_email

    # Pickle this dictionary and write to file for future use
    email_hash_dict_file = get_email_hash_dict_file_path()
    email_hash_dict_file_handler = open(email_hash_dict_file, 'wb')
    pickle.dump(email_hash_dict, email_hash_dict_file_handler)
    email_hash_dict_file_handler.close()

    # Drop the clear text columns 
    target_repo_commits.drop(columns=['Author', 'Email', 'Committer', 'file_name', 'file_old_path', 'file_new_path'],
                             inplace=True)

    # Write it out to the file. This is the file that is to be uploaded for scoring and prediction.
    target_repo_commits.to_csv(get_anonymized_file_path())
    display_anonymized_file_path()
    display_anonymized_dict_file_path()

    sg.popup('Anonymize is done.', '\n\nAnonymize File location:\n' + get_anonymized_file_path(),
             '\n\nAnonymize File Dictionary location:\n' + get_email_hash_dict_file_path())


def de_anonymize():
    # Read the file to be decrypted
    anonymized_predictions_data = pandas.read_csv(get_anonymized_predictions_file_path())
    target_repo_commits = pandas.read_csv(get_output_file_path())
    # TODO: KC - Add code here to check that shapes of these 2 data frames match.
    #

    # Read saved dictionary file and recreate the dictionary
    email_hash_dict_file_handler = open(get_email_hash_dict_file_path(), 'rb')
    email_hash_dict = pickle.load(email_hash_dict_file_handler)

    # Put back the original values for the anonymized data
    dev_predictions_file_path = os.path.join(get_predictions_directory_path(),
                                             'dev_scores_' + get_target_repo_raw_data_file_name())

    predictions_data = anonymized_predictions_data.copy()

    # Iterate through each row to put back the emails
    for i in range(len(predictions_data)):
        hashed_email = anonymized_predictions_data.loc[i, 'Email_encrypted']
        predictions_data.loc[i, 'Email'] = email_hash_dict.get(hashed_email)

    predictions_data.to_csv(dev_predictions_file_path)
    display_de_anonymized_predictions_file_path(dev_predictions_file_path)
    sg.popup('De Anonymizing is done and File location is', dev_predictions_file_path)


#  Methods Related to 'PySimpleGui'
def update_progress_bar(completed_commits):
    len_completed_commits = len(completed_commits)

    logging.info('PROCESS / COMMITS COUNTs:: ' +
                 str(len_completed_commits) + ' / ' + str(total_commits_count))

    progressBar.update_bar(len_completed_commits, total_commits_count)
    progressBarText.update(str(len_completed_commits) +
                           ' / ' + str(total_commits_count))

    if len(completed_commits) == total_commits_count:
        progressBarText.update(visible=False)
        progressBar.update_bar(0, 0)
    else:
        progressBarText.update(visible=True)


def display_anonymized_file_path():
    w_i_anonymized_file.update(get_anonymized_file_path())


def display_data_file_location_path():
    w_i_data_file_location.update(get_output_file_path())


def display_anonymized_dict_file_path():
    w_i_anonymized_dict_file.update(get_email_hash_dict_file_path())


def display_de_anonymized_predictions_file_path(path):
    w_i_de_anonymized_file.update(path)


def start_gui_Window():
    global progressBar
    global progressBarText
    global inputDestDir
    global dataFileLocation
    global w_i_anonymized_file
    global w_i_anonymized_dict_file
    global w_i_data_file_location
    global w_i_de_anonymized_file

    global gitDirectory
    global DestDirectory

    window = sg.Window('Dev Ranker', layout_main,
                       background_color='white', finalize=True)
    progressBar = window['_pb']
    progressBarText = window['_t_ProgressValue']
    inputDestDir = window['_i_DestDirectory']
    dataFileLocation = window['_i_DFL']
    w_i_anonymized_file = window['_i_AFL']
    w_i_anonymized_dict_file = window['_i_ADL']
    w_i_data_file_location = window['_i_DFL']
    w_i_de_anonymized_file = window['_i_DAPF']

    while True:
        event, values = window.Read()

        # Step-1 Related
        if event in (None, 'Exit'):
            break

        elif event == '_i_GitDirectory':
            path = values['_i_GitDirectory']
            logging.info('_i_GitDirectory', path)
            # Verify if this is a gitRepo right here.
            try:
                repo = git.Repo(path)
                set_git_directory_path(path)
            except:
                sg.popup(
                    'Invalid Git Directory, Please choose valid Git Directory')
                # kc Need to clear gitDirectory
                continue

        elif event == '_i_StartMining':
            if validate_directories():
                set_devranker_dir()
                set_output_file_path()
            else:
                # Need to clear gitDirectory and DestDir here or at respective places.
                continue
            try:
                store_commit_data()
            except:
                continue

        elif event == '_i_LiveLog':
            pass

        elif event == '_i_DestDirectory':
            set_dest_directory_path(values['_i_DestDirectory'])

        # Step-2 Related
        elif event == '_b_Inspect_DFL':
            pass

        elif event == '_b_Inspect_AFL':
            pass

        elif event == '_b_Inspect_ADL':
            pass

        elif event == '_b_GetPredictions':
            pass

        elif event == '_b_Encrypt':
            anonymize()

        # Step-3 Related
        elif event == '_b_Inspect_APF':
            pass

        elif event == '_b_Decrypt':
            de_anonymize()


        # Step-4 Related
        elif event == '_b_Inspects_DAPF':
            pass

        elif event == '_b_Showcharts':
            pass

    window.close


if __name__ == '__main__':
    # We should call this 'mp.set_start_method("spawn")' here only even though 'mp' used
    # in 'store_commit_data()' only, because when pressing 'Start Mining' button 2nd time
    # (Mostly after mining is done) 'mp.set_start_method("spawn")' throwing exception

    # Why 'set_start_method("spawn")'?
    # Because getting Multiple windows unnecessarily and window became unresponsive after Mining is done
    # Ref: https://pythonspeed.com/articles/python-multiprocessing/

    mp.set_start_method("spawn")

    # Calling window and initializing required widgets
    start_gui_Window()
