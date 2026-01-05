{
  description = "three-mesh-edit dev shell";

  inputs.nixpkgs.url = "nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
      };
    in {
      devShells.${system}.default = pkgs.mkShell {
        name = "three-mesh-edit-devshell";

        buildInputs = [
          pkgs.pkg-config
          pkgs.nodejs_24
        ];
      };
    };
}
