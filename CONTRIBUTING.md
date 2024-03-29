# Contributing

## Reporting issues

For urgent matters with the extension, or if you have issues with the underlying IAR Embedded Workbench or IAR Build Tools product, report this via the IAR Systems technical support channel at [IAR Technical Support](https://www.iar.com/knowledge/support/request-technical-support/).
For other matters isolated to this extension, file a [New issue](https://github.com/IARSystems/iar-vsc-build/issues/new/choose) using the provided template. We will reply on a "best effort basis".

Your bug report should include:

* A short description of the bug
* Instructions for how to reproduce the bug
* Any relevant logs or error messages. Logs can be found in the **Output** panel in VS Code, by selecting `IAR Build`,
 `IAR Config Generator` or `IarServiceManager` in the dropdown in the top right.

## Feature requests

To request a new feature, please first check if there is already a GitHub issue describing the feature you would like.
If there is, please comment on and/or upvote that issue. Otherwise, you can create a new issue describing the feature
you would like to have and why you want it.

## Contributing pull requests

We welcome pull requests from users to this repository, such as documentation changes, bugfixes or new features.
If the changes you want to make are large, please create an issue describing the changes *before* you start developing,
so that we can discuss the best way to implement the changes.

### Getting started

To build and run the extension from source on your computer, first clone this repository.

Install the dependencies:

```sh
npm install
```

Then, open this repository in VS Code, and install the recommended extensions.
Start the extension by running the debug configuration `Extension` from the **Run and Debug** view.
