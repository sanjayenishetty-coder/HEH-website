/**
 * Core team. Photos live in /public/team. Add a person by adding an object here.
 * `focus` is the CSS object-position used to keep faces centred in the crop.
 */
export interface TeamMember {
  name: string;
  role: string;
  photo?: string;
  focus?: string;
  linkedin?: string;
  email?: string;
}

export const team: TeamMember[] = [
  {
    name: "Sanjay Enishetty",
    role: "Chief Mentor & Advisor",
    photo: "/team/sanjay-enishetty.jpg",
    focus: "center 15%",
    linkedin: "https://www.linkedin.com/in/sanjayenishetty/",
    email: "sanjayenishetty@gmail.com",
  },
  {
    name: "Naresh Kuchi",
    role: "Managing Director",
    photo: "/team/naresh-kuchi.jpg",
    focus: "center 15%",
    linkedin: "https://www.linkedin.com/in/naresh-kuchi-5813691a5/",
    email: "nareshk@entrepreneurhub.in",
  },
  {
    name: "Sai Prakash",
    role: "Marketing Head",
    photo: "/team/sai-prakash.jpg",
    focus: "center 15%",
    linkedin: "https://www.linkedin.com/in/saiprakashav/",
    email: "heh@entrepreneurhub.in",
  },
  {
    name: "DVP Sridhar",
    role: "Head – Operations",
    photo: "/team/dvp-sridhar.jpg",
    focus: "center 10%",
    linkedin: "https://www.linkedin.com/in/sridhar-dadhirao-5b657624",
  },
  {
    name: "Manjusha M",
    role: "Head – Women's Win",
    photo: "/team/manjusha-m.jpg",
    focus: "center 20%",
    linkedin: "https://www.linkedin.com/in/manjusha-973545103/",
  },
  {
    name: "Jaya Lakshmi",
    role: "Head – Membership Growth",
    photo: "/team/jaya-lakshmi.jpg",
    focus: "center 10%",
  },
];
