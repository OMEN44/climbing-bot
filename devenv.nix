{ pkgs, lib, config, inputs, ... }:

{
  languages.javascript = {
    enable = true;
    npm.enable = true;
    corepack.enable = true;
  };

  scripts = {
    run.exec = "yarn start";
    deploy.exec = "yarn deploy";
  };

  enterShell = ''
    yes | yarn
  '';
}
