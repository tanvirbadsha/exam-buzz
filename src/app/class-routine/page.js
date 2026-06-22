import { ClassRoutineManager } from "@/features/class-routine/ClassRoutineManager";
import { DEFAULT_CLASS_ROUTINES } from "@/lib/classRoutineData";

async function getClassRoutines() {
  // Replace this mock with the class-routine API call when the endpoint is ready.
  return DEFAULT_CLASS_ROUTINES;
}

export default async function ClassRoutinePage() {
  const routines = await getClassRoutines();

  return <ClassRoutineManager initialRoutines={routines} />;
}
