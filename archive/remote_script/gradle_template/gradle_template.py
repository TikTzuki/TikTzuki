import os.path

single_template = ""
modulith_template = ""
import xml.etree.ElementTree as ET
import os

single_template = '''
plugins \u007B
    id "java"
    id "org.jetbrains.kotlin.jvm" version "2.1.0"
    id "org.jetbrains.kotlin.plugin.spring" version "1.9.25"
    id "org.springframework.boot" version "3.4.3"
    id "io.spring.dependency-management" version "1.1.7"
    id "org.jetbrains.kotlin.plugin.lombok" version "2.1.10"
    id "io.freefair.lombok" version "8.10"
\u007D
'''


def convert_mvn_to_single_gradle(pom_path: str):
    tree = ET.parse(pom_path)
    root = tree.getroot()
    namespace = {'project': 'http://maven.apache.org/POM/4.0.0'}
    group_id = root.find("project:groupId", namespace).text
    version = root.find("project:version", namespace).text

    dependencies = []
    for dependency in root.findall(f".//project:dependency", namespace):
        dep_group_id = dependency.find("project:groupId", namespace).text
        dep_artifact_id = dependency.find("project:artifactId", namespace).text
        version = dependency.find("project:version", namespace)
        if version is not None:
            if version.text[0] == "{":
                dep_version = ":" + "test"
            else:
                dep_version = ":" + version.text
        else:
            dep_version = ""
        dependencies.append(f'implementation "{dep_group_id}:{dep_artifact_id}{dep_version}"')

    dependencies_str = "\n    ".join(dependencies)

    gradle_content = single_template#.format(group_id=group_id)#, version=version, dependencies=dependencies_str)

    print(gradle_content)


def convert_mvn_to_gradle(type: str, maven_file: str, dest_dir: str):
    file = os.path.join(dest_dir, "build.gradle")

    if type == "single":
        convert_mvn_to_single_gradle(maven_file)

    # with open(file, "w") as gradle_file:
    #     gradle_file.write("")
