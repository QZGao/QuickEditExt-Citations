# QuickEditExt-Citations

This user script shows all named citations on the current page, in the format of `<ref name="ref-name">...</ref>`. To quickly name (and sort) all citations, you can use [refOrganizer](https://en.wikipedia.org/wiki/zh:User:SuperGrey/gadgets/refOrganizer) or [RefRenamer](https://en.wikipedia.org/wiki/en:User:Nardog/RefRenamer).

This is an extension of several [Quick Edit](https://www.mediawiki.org/wiki/Quick_Edit) tools on the market. That being said, it doesn't rely on any user scripts or gadgets, and can run independently.

By default, it will show on all pages in Main, User, and Draft namespaces with wikitext content model. You can toggle off the visibility in User namespace through Settings. 

Project page: [QuickEditExt-Citations](https://meta.wikimedia.org/wiki/User:SuperGrey/gadgets/QuickEditExt-Citations)

## Usage
To use Select-a-lot on one of the supported wikis, or install it on all wikis:
- For one wiki: Add the following line to your common.js page on that wiki (e.g. [English Wikipedia common.js](https://en.wikipedia.org/wiki/Special:MyPage/common.js)).
- For all wikis: Add the following line to your global.js page on [Meta-Wiki](https://meta.wikimedia.org/wiki/Special:MyPage/global.js).
```javascript
mw.loader.load("//meta.wikimedia.org/w/index.php?title=User:SuperGrey/gadgets/QuickEditExt-Citations.js&action=raw&ctype=text/javascript"); // Backlink: [[meta:User:SuperGrey/gadgets/QuickEditExt-Citations]]
```
