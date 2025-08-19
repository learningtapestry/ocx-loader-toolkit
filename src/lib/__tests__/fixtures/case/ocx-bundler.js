const fs = require("fs")
const path = require("path")
const data = require("./case-demo-framework.json")

const getItemById = (id) => {
  if (data.CFDocument.identifier === id) {
    return data.CFDocument
  }

  return data.CFItems.find((item) => item.identifier === id)
}

const getItemChildren = (id) => {
  return data.CFAssociations.filter(
    (association) =>
      association.destinationNodeURI.identifier === id &&
      association.associationType === "isChildOf",
  ).map((association) => getItemById(association.originNodeURI.identifier))
}

const getItemParents = (id) => {
  return data.CFAssociations.filter(
    (association) =>
      association.originNodeURI.identifier === id && association.associationType === "isChildOf",
  ).map((association) => getItemById(association.destinationNodeURI.identifier))
}

const findItemByIdInMyTree = (id, tree) => {
  let element = tree.find((item) => item.identifier === id)
  if (!element) {
    const direction = tree[0].modules ? "modules" : "lessons"
    element = findItemByIdInMyTree(
      id,
      tree.flatMap((item) => item[direction]),
    )
  }

  return element
}

let courses = getItemChildren(data.CFDocument.identifier)
courses = courses.map((course) => ({
  ...course,
  extensions: {
    ...course.extensions,
    ocx: {
      version: "1.0.0",
      nodes: [
        {
          "@context": "https://schema.org/Course",
          "@type": "Course",
          identifier: course.identifier,
          name: course.fullStatement,
          hasPart: getItemChildren(course.identifier).map((unit) => ({
            name: unit.fullStatement,
            identifier: unit.identifier,
          })),
        },
      ],
    },
  },
  modules: getItemChildren(course.identifier).map((unit, index) => ({
    ...unit,
    extensions: {
      ...unit.extensions,
      ocx: {
        version: "1.0.0",
        nodes: [
          {
            "@context": "https://schema.org/LessonGrouping",
            "@type": "LessonGrouping",
            identifier: unit.identifier,
            hasPart: getItemChildren(unit.identifier).map((lesson) => ({
              identifier: lesson.identifier,
              name: lesson.fullStatement,
            })),
            name: unit.fullStatement,
            position: index + 1,
            isPartOf: [{ identifier: course.identifier, name: course.fullStatement }],
          },
        ],
      },
    },
    lessons: getItemChildren(unit.identifier).map((lesson, lessonIndex) => ({
      ...lesson,
      extensions: {
        ...lesson.extensions,
        ocx: {
          version: "1.0.0",
          nodes: [
            {
              "@context": "https://chanzuckerberg.com/Activity",
              "@type": "Activity",
              identifier: lesson.identifier.replace(/(?<=-)[0-9a-fA-F]{12}$/, "616374697669"),
              name: lesson.fullStatement,
              isPartOf: [{ identifier: lesson.identifier, name: lesson.fullStatement }],
              description: `<a href="${lesson.extensions.resourceURL}" /><br /><br />${lesson.extensions.fullContent}`,
              position: 1,
            },
            {
              "@context": "https://chanzuckerberg.com/Lesson",
              "@type": "Lesson",
              identifier: lesson.identifier,
              name: lesson.fullStatement,
              hasPart: [
                {
                  identifier: lesson.identifier.replace(/(?<=-)[0-9a-fA-F]{12}$/, "616374697669"),
                  name: lesson.fullStatement,
                },
              ],
              isPartOf: [{ identifier: unit.identifier, name: unit.fullStatement }],
              position: lessonIndex + 1,
            },
          ],
        },
      },
    })),
  })),
}))

const output = {
  ...data,
  CFItems: data.CFItems.map((item) => findItemByIdInMyTree(item.identifier, courses)),
}

fs.writeFileSync(path.join(__dirname, "output.json"), JSON.stringify(output, null, 2))
