import { mathjax } from "mathjax-full/js/mathjax"
import { TeX } from "mathjax-full/js/input/tex"
import { SVG } from "mathjax-full/js/output/svg"
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages"
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor"
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html"

const adaptor = liteAdaptor()
RegisterHTMLHandler(adaptor)

const mathjax_document = mathjax.document("", {
	InputJax: new TeX({ packages: AllPackages }),
	OutputJax: new SVG({ fontCache: "local" }),
})

function get_mathjax_svg(math) {
	const node = mathjax_document.convert(math, { display: true })
	return adaptor.innerHTML(node)
}

export { get_mathjax_svg }
