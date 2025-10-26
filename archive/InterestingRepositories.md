**Docker Oracle:** wnameless/docker-oracle-xe-11g  
**Spring Data:** spring-projects/spring-data-book  
**Solid Project:** solid/solidproject.org  
**Linux:** torvalds/linux  
## Git commands
### Unstage file: 
```
git restore --staged [file_paths]
```
### Changing the latest Git commit message
```
git commit --amend -m "New message"
git push --force remote-name branch-name
```
## Setup oracle_client
Download instantclient: \
  https://www.oracle.com/database/technologies/instant-client.html \
Install packages:
```
sudo apt-get install libaio1 libaio-dev
```
# Jetbrain trick lore
```
# linux
rm -rf ~/.config/JetBrains/IntelliJIdea*/eval/*.evaluation.key ~/.config/JetBrains/IntelliJIdea*/options/other.xml ~/.java/.userPrefs/jetbrains/idea
# mac os
rm ~/Library/Application\ Support/JetBrains/IntelliJIdea*/eval/*.evaluation.key ~/Library/Application\ Support/JetBrains/IntelliJIdea*/options/other.xml ~/Library/Preferences/jetbrains.idea.* ~/Library/Preferences/com.apple.java.util.prefs.plist
```
