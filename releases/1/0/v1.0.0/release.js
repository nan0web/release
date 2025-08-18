import { Contact } from "@nan0web/contact"

class Person {
	name
	contacts
	gpgKey
	revokedKey
	constructor(input = {}) {
		const {
			name = "",
			contacts = [],
			gpgKey = null,
			revokedKey = null
		} = input
		this.name = String(name)
		this.contacts = contacts.map(c => Contact.from(c))
		this.gpgKey = gpgKey
		this.revokedKey = revokedKey
	}
	static from(input) {
		if (input instanceof Person) return input
		return new Person(input)
	}
}

class Members {
	static YaRaSLove = new Person({
		name: "YaRaSLove",
		contacts: [
			new Contact("https://yaro.page"),
			new Contact("mailto:support@yaro.page"),
			new Contact("tel:00123456789"),
		],
		gpgKey: "ABC123456789"
	})
	static Taras = new Person({
		name: "Taras Shevchenko",
		contacts: [
			new Contact("mailto:taras.shevchenko@ukraine.history")
		],
		gpgKey: "DEF987654321"
	})
}

class DevTeam {
	static name = "Development software"
	static developer = Members.YaRaSLove
}

class UXTeam {
	static name = "User experience and design"
	static designer = Members.Taras
}

class Company {
	static name = "NaN•Web"
	static dev = DevTeam
	static ux = UXTeam
}

class Release {
	static company = Company
	static version = "v1.0.0"
	static date = "2025-08-18"
	static teams = [DevTeam, UXTeam]
	static members = Members
}

export default Release
