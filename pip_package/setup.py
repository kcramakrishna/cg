import setuptools
with open("README.md", "r") as fh:
    long_description = fh.read()
setuptools.setup(
    name='devranker_gui',
    version='0.1 Alpha',
    scripts=['devranker_gui'],
    author="Ravi",
    author_email="ravi.k@cognitivzen.com",
    description="devranker getdata gui package",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/kcramakrishna/devranker",
    packages=setuptools.find_packages(),
    # TODO: 
    # 'packages' does not seems to be working. 
    # So only adding modules manually. 
    # Need to change it as automatic. 
    install_requires=['pydriller', 'more-itertools', 'numpy',
                      'pandas', 'pathlib', 'PySimpleGUI', 'python-dateutil'],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: GNU Affero General Public License v3",
        "Operating System :: OS Independent",
    ],
)