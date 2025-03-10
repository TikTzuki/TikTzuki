single_template = ""
modulith_template = ""

def convert_mvn_to_gradle(dest: str):
    with open(dest, "w") as gradle_file:
        gradle_file.write("Hello")
