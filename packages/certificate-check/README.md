# Wire

This repository is part of the source code of Wire. You can find more information at [wire.com](https://wire.com) or by contacting opensource@wire.com.

You can find the published source code at [github.com/wireapp](https://github.com/wireapp).

For licensing information, see the attached LICENSE file and the list of third-party licenses at [wire.com/legal/licenses/](https://wire.com/legal/licenses/).

## Certificate Check

Tool to check that Wire's domains use the expected certificate.

### Screenshot

![Screenshot](./preview.png)

### Usage

**Node.js**

```bash
yarn
yarn start
```

**Additional terminal usage**

There is a command-line interface to output the certificate fingerprint. It works like this:

```bash
node get_fingerprint.js --url https://app.wire.com
```
