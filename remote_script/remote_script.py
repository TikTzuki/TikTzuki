import argparse
from argparse import Namespace

from gradle_template import gradle_template


def main():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command")

    gradle_template_parser = subparsers.add_parser('gradle_template', help='Generate build.gradle')
    gradle_template_parser.add_argument("-t", '--type', help='', required=False, default="single",
                                        choices=["single", "modulith"])
    gradle_template_parser.add_argument("-m", '--maven-file', help='', required=False, default="pom.xml")
    gradle_template_parser.add_argument("-g", '--gradle-file', help='', required=False, default=".")

    args: Namespace = parser.parse_args()

    if args.command == "gradle_template":
        gradle_template.convert_mvn_to_gradle(args.type, args.maven_file, args.gradle_file)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
