'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
// const utils = require('../lib/utils');
const libxmljs = require('libxmljs');
// const debug = require( 'debug' )( 'Xform model' );

// TODO move
const FORMSTORAGEPATH = path.resolve(__dirname, '../../storage/forms');

class Xform {
  static node(arg0: string) {
    throw new Error('Method not implemented.');
  }
  data: any;
  doc: any;
  namespaces: {
    xmlns: string;
    h: string;
    jr: string;
    orx: string;
    xsd: string;
    ev: string;
  };
  constructor(private readonly id: string, private readonly path: string) {}

  initialize() {
    const xform = this;
    return new Promise(function (resolve, reject) {
      // mimicking future async db query
      fs.readFile(xform.path, 'utf-8', (error: any, data: any) => {
        if (error) {
          reject(error);
        } else {
          xform.data = data;
          //that.data = '<data>dfdsa';
          try {
            xform.doc = libxmljs.parseXml(xform.data);
            xform.namespaces = xform._getNamespaces();
            //debug( 'defaultNamespace', JSON.stringify( that.defaultNamespace[ 0 ] ) );
            resolve(true);
          } catch (e) {
            const err = new Error(
              'XML Error in form "' + xform.id + '": ' + JSON.stringify(e),
            );
            reject(err);
          }
        }
      });
    });
  }

  getProperties(baseUrl: any) {
    const xform = this;

    return this.initialize().then(() => {
      const props = {
        formID: xform._getFormId(),
        name: xform._getName(),
        majorMinorVersion: xform._getMajorMinorVersion(),
        version: xform._getVersion(),
        // hash: xform._getHash(),
        downloadUrl: xform._getDownloadUrl(baseUrl),
      };

      return xform._getManifestUrl(baseUrl).then(function (manifestUrl: any) {
        if (manifestUrl) {
          props['manifestUrl'] = manifestUrl;
        }
        return props;
      });
    });
  }

  _getNamespaces() {
    // TODO: extract these from this.doc instead
    return {
      xmlns: 'http://www.w3.org/2002/xforms',
      h: 'http://www.w3.org/1999/xhtml',
      jr: 'http://openrosa.org/javarosa',
      orx: 'http://openrosa.org/xforms',
      xsd: 'http://www.w3.org/2001/XMLSchema',
      ev: 'http://www.w3.org/2001/xml-events',
    };
  }

  _getFormId() {
    let id = this.doc.get(
      '//xmlns:model/xmlns:instance/node()[@id]',
      this.namespaces,
    );
    if (!id) {
      throw new Error('id attribute not found for form "' + this.id + '"');
    }
    // there has to be a better way to get this id and version...
    id = id.attr('id').toString();
    return id.substring(5, id.length - 1);
  }

  _getName() {
    const title = this.doc.get('//h:head/h:title', this.namespaces);

    if (!title) {
      throw new Error('title element not found for form "' + this.id + '"');
    }
    return title.text();
  }

  _getMajorMinorVersion() {
    return '';
  }

  _getVersion() {
    let version = this.doc.get(
      '//xmlns:model/xmlns:instance/node()[@version]',
      this.namespaces,
    );
    if (!version) {
      return '';
    }
    // there has to be a better way to get this version...
    version = version.attr('version').toString();
    return version.substring(10, version.length - 1);
  }

  //   _getHash() {
  //     return 'md5:' + utils.md5(this.data);
  //   }

  _getDescriptionText() {
    return this._getName();
  }

  _getDescriptionUrl() {
    return '';
  }

  _getDownloadUrl(baseUrl: any) {
    return url.resolve(baseUrl, path.join('form', this.id, 'form.xml'));
  }

  _getManifestUrl(baseUrl: any) {
    const xform = this;

    return new Promise((resolve, reject) => {
      fs.readdir(
        path.join(FORMSTORAGEPATH, xform.id + '-media'),
        (error: any, files: string | any[]) => {
          if (error || files.length === 0) {
            resolve(null);
          } else {
            resolve(
              url.resolve(
                baseUrl,
                path.join('/form/', xform.id, '/manifest.xml'),
              ),
            );
          }
        },
      );
    });
  }
}

export default Xform;
