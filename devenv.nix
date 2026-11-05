{ ... }:

{
  languages.javascript = {
    enable = true;
    npm.enable = true;
    corepack.enable = true;
  };

  processes = {
    start = {
      exec = "yarn start";
    };
  };

  scripts = {
    deploy.exec = "yarn deploy";
  };

  enterShell = ''
    yes | yarn
  '';
}
