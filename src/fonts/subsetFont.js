import {
  error,
} from 'colorful-logging';
import {
  FontStyles,
} from './FontStyles';
import {
  getFontFilepath,
} from './getFontFilepath';
import GlyphHanger from 'glyphhanger';
import GlyphHangerFontFace from 'glyphhanger/src/GlyphHangerFontFace';
import GlyphHangerWhitelist from 'glyphhanger/src/GlyphHangerWhitelist';
import {
  LocalGlyphHangerSubset,
} from '../../lib/GlyphHanger/LocalGlyphHangerSubset';
import * as path from 'path';
import {
  paths,
} from '../../config/paths';
import {
  assert,
} from 'ts-assertions';

export const subsetFont = ({
  directory,
  fontsToLoad,
  subsetFont: {
    fromFamily,
    subsetRange,
  },
}) => new Promise(async (resolve, reject) => {
  try {
    assert(directory);
    assert(Array.isArray(fontsToLoad) && fontsToLoad.length);
    assert(fromFamily);
    assert(subsetRange);
  
    const fontLoadingObjToSubset = fontsToLoad.find(({ family }) => (
      family === fromFamily
    ));
  
    if (!fontLoadingObjToSubset) {
      warn('No font loading object could be found for subsetting which ' +
            `matched the family "${fromFamily}".`);
      return resolve(getReturnObject());
    }
  
    const {
      formats,
      family,
      weights,
    } = fontLoadingObjToSubset;
  
    const format = formats[0];
    const weight = weights.indexOf(400) === -1 ? weights[0] : 400;
  
    const pathOfFontToSubset = getFontFilepath({
      directory,
      family,
      format,
      weight,
      style: FontStyles.Normal,
    });
  
    const ghff = new GlyphHangerFontFace();
  
    const lghs = new LocalGlyphHangerSubset();
    lghs.setOutputDirectory(directory);
    lghs.setFormats(formats.join(','));
    await lghs.setFontFilesGlob(pathOfFontToSubset);
  
    ghff.setSubset(lghs);
  
    let ghw;
    if (/^latin$/i.test(subsetRange)) {
      ghw = new GlyphHangerWhitelist(null, { LATIN: true });
    } else if (/^us[_-]ascii$/i.test(subsetRange)) {
      ghw = new GlyphHangerWhitelist(null, { US_ASCII: true });
    } else {
      ghw = new GlyphHangerWhitelist(subsetRange);
    }
  
    const unicodes = ghw.getWhitelistAsUnicodes();
  
    ghff.setUnicodeRange(unicodes);
  
    const gh = new GlyphHanger();
  
    gh.setSubset(pathOfFontToSubset);
    gh.setWhitelist(ghw);  
    gh.output();
  
    await lghs.subsetAll(unicodes);
  
    ghff.setUnicodeRange(unicodes);
    ghff.output();
  
    const subsetName = `${fromFamily} Subset`;
    const subsetSrc = formats.map((format) => (
      `url('` +
        `${paths.publicUrl}/fonts/autogenerated/` +
        `${path.parse(pathOfFontToSubset).name}-subset.${format}` +
      `') ` +
      `format('${format}')`
    )).join(', ');
  
    const fontFaceRule =
      `/* ${subsetRange} subset */\n` +
      `@font-face {\n` +
      `  font-family: '${subsetName}';\n` +
      `  font-style: normal;\n` +
      `  src: ${subsetSrc};\n` +
      `  unicode-range: ${unicodes};\n` +
      `}`;

    return resolve(getReturnObject(fontFaceRule, subsetName));
  } catch (err) {
    error(err);
    reject(err);
  }

  return resolve(getReturnObject());
});

const getReturnObject = (fontFaceRule, subsetName) => ({
  fontFaceRule: fontFaceRule || null,
  subsetName: subsetName || null,
});