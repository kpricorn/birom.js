# Sample Capistrano deployment configuration file.
# See http://peepcode.com/products/capistrano-2 or http://www.capify.org/

set :application, "example.com"
set :repository,  "git@example.com:project.git"
set :user, "user"
set :use_sudo, false

set :deploy_to, "/var/www/apps/#{application}"

set :scm, :git
set :branch, "master"
set :deploy_via, :remote_cache
set :repository_cache, "git_#{branch}".gsub(/\//, '_') # Dir with name of branch
set :git_shallow_clone, 1
set :scm_command, "/usr/bin/git"

set :server_software, "runit"

server "example.com", :app, :web
role :db, "example.com", :primary => true

after "deploy",         "deploy:cleanup"

case server_software
when 'runit'

  namespace :deploy do
    desc "Restart node with runit"
    task :restart, :roles => :app, :except => { :no_release => true } do
      run "sv restart ~/service/#{application}-node"
    end

    desc "Start node with runit"
    task :start, :roles => :app, :except => { :no_release => true } do
      run "sv start ~/service/#{application}-node"
    end

    desc "Stop node with runit"
    task :stop, :roles => :app, :except => { :no_release => true } do
      run "sv stop ~/service/#{application}-node"
    end

  end

end

namespace :util do

  desc "Delete repository cache"
  task :delete_repository_cache do
    run "rm -rf #{shared_path}/#{repository_cache}"
  end

end
