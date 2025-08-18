class Person {
	name
	constructor(name) {
		this.name = name
	}
}

class CLevelTeam {
	static name = "C Level"
	static ceo = new Person("Yaroslav Wise")
	static cfo = new Person("Chingis")
}

class UXTeam {
	static name = "UX"
	static designer = new Person("Taras Shevchenko")
}

class Company {
	static name = "NaN•Web"
	static c = CLevelTeam
	static ux = UXTeam
}

export default Company
