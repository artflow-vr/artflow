#!/bin/sh

setup_git() {
  echo "Setting up the git configuration..."
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis CI"
}

commit_website_files() {
  mkdir /tmp/prod_folder
  echo "Cloning the github pages repository to /tmp..."
  git clone https://${GITHUB_TOKEN}@github.com/DavidPeicho/davidpeicho.github.io.git /tmp/prod_folder > /dev/null 2>&1

  echo "Creating artflow folder if does not exist"
  mkdir -p /tmp/prod_folder/artflow

  echo "Copying assets and build to /tmp/prod_folder/artflow..."
  cp -r assets /tmp/prod_folder/artflow
  cp -r build /tmp/prod_folder/artflow

  cd /tmp/prod_folder

  echo "Creating the branch 'gh-pages'..."
  git checkout -b gh-pages

  echo "Staging the files 'artflow'..."
  git add artflow
  git commit --message "Travis build: $TRAVIS_BUILD_NUMBER"
}

upload_files() {
  echo "Starting to push..."
  git push --quiet --set-upstream origin gh-pages
}

setup_git
commit_website_files
upload_files
